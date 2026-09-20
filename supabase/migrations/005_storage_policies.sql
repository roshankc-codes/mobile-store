-- =============================================================================
-- Migration 005: Storage Bucket Policies
-- Mobile Store E-Commerce Platform
-- =============================================================================
-- Creates three logical storage buckets and configures their access policies
-- via RLS on the storage.objects table.
--
-- Buckets:
--   product-media   Public read  — storefront product images and videos
--   banners         Public read  — homepage promotional media
--   payment-proofs  Private      — manual payment screenshots
--
-- SECURITY:
--   - payment-proofs bucket is explicitly private (public = FALSE).
--   - Customers cannot access another customer's payment proof.
--   - Only staff/owner can read all payment proofs.
--   - All bucket modifications (INSERT/UPDATE/DELETE) require staff or owner.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- Create buckets
-- ON CONFLICT allows re-running this migration idempotently.
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'product-media',
    'product-media',
    TRUE,
    10485760,   -- 10 MB per file
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
  ),
  (
    'banners',
    'banners',
    TRUE,
    5242880,    -- 5 MB per file
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  ),
  (
    'payment-proofs',
    'payment-proofs',
    FALSE,      -- Private: no public URL access
    5242880,    -- 5 MB per file
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  )
ON CONFLICT (id) DO NOTHING;


-- ===========================================================================
-- product-media bucket policies
-- ===========================================================================

-- Public read: anyone can view product images
CREATE POLICY "product_media_objects_select_public"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'product-media');

-- Staff and owner can upload product media
CREATE POLICY "product_media_objects_insert_staff_owner"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-media'
    AND public.auth_role() IN ('staff', 'owner')
  );

-- Staff and owner can update product media metadata
CREATE POLICY "product_media_objects_update_staff_owner"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-media'
    AND public.auth_role() IN ('staff', 'owner')
  );

-- Only owner can delete product media
CREATE POLICY "product_media_objects_delete_owner"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-media'
    AND public.auth_role() = 'owner'
  );


-- ===========================================================================
-- banners bucket policies
-- ===========================================================================

-- Public read: storefront displays active banners
CREATE POLICY "banners_objects_select_public"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'banners');

-- Staff and owner can upload banner images
CREATE POLICY "banners_objects_insert_staff_owner"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'banners'
    AND public.auth_role() IN ('staff', 'owner')
  );

-- Staff and owner can update banner images
CREATE POLICY "banners_objects_update_staff_owner"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'banners'
    AND public.auth_role() IN ('staff', 'owner')
  );

-- Only owner can delete banners
CREATE POLICY "banners_objects_delete_owner"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'banners'
    AND public.auth_role() = 'owner'
  );


-- ===========================================================================
-- payment-proofs bucket policies
--
-- This bucket is PRIVATE (no public URL access).
-- Customers may upload their own proof; they cannot read other customers'.
-- Staff and owner can read all proofs for payment verification.
-- ===========================================================================

-- ==========================================================================
-- F2 FIX: Payment-proof upload ownership via storage path convention.
--
-- Path convention (enforced by policy AND documented for the application):
--
-- Bucket: 'payment-proofs'
-- Object path (storage.objects.name):
--   {auth.uid()}/{payment_id}/{filename}
--   (Do NOT include 'payment-proofs/' prefix in storage.objects.name; bucket_id identifies the bucket)
--
-- Examples:
--   a1b2c3d4-.../pay-uuid.../receipt.jpg
--
-- storage.objects.name contains the path WITHIN the bucket, so:
--   name = '{auth.uid()}/{payment_id}/{filename}'
--   split_part(name, '/', 1)  →  caller's UID
--   split_part(name, '/', 2)  →  payment UUID
--   split_part(name, '/', 3)  →  original filename (not used in policy)
--
-- Why this is not circular:
--   The public.payment_proofs table row is inserted by the application AFTER
--   the storage upload succeeds. This policy therefore CANNOT reference that
--   table for INSERT authorization (that caused the original circular failure).
--   Instead, ownership is established by:
--     1. First path component = auth.uid()    (identity, no join needed)
--     2. Payment with id = second component exists in public.payments
--     3. That payment belongs to an order whose customer_id = auth.uid()
--   These three checks use only public.payments and public.orders, which are
--   populated before the upload and are not subject to the circular dependency.
--
-- Anonymous users:
--   Policy is TO authenticated — anon cannot upload under any path.
--
-- Cross-customer isolation:
--   A customer cannot upload into another customer's UID directory because
--   split_part(name, '/', 1) must equal auth.uid()::TEXT.
--
-- Staff/owner:
--   May upload anywhere in the bucket (e.g. on behalf of a walk-in customer).
--   Still restricted to the payment-proofs bucket.
-- ==========================================================================
CREATE POLICY "payment_proofs_objects_insert_own"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'payment-proofs'
    AND (
      -- Staff and owner may upload anywhere within the bucket
      public.auth_role() IN ('staff', 'owner')

      -- Customers: enforce path-convention ownership without relying on
      -- a payment_proofs DB row (which does not exist yet at upload time).
      OR (
        public.auth_role() = 'customer'

        -- Rule 1: first path segment must match the uploading user's own UID.
        -- This prevents a customer from writing into another customer's directory.
        AND split_part(name, '/', 1) = auth.uid()::TEXT

        -- Rule 2 & 3: the referenced payment must exist and must belong to
        -- an order owned by this customer.
        AND EXISTS (
          SELECT 1
          FROM   public.payments py
          JOIN   public.orders   o ON o.id = py.order_id
          WHERE  py.id::TEXT   = split_part(name, '/', 2)
          AND    o.customer_id = auth.uid()
        )
      )
    )
  );

-- Customers can read only files they themselves uploaded.
-- Identified by matching uploaded_by in payment_proofs metadata table.
CREATE POLICY "payment_proofs_objects_select_own"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'payment-proofs'
    AND EXISTS (
      SELECT 1
      FROM   public.payment_proofs pp
      WHERE  pp.storage_path = name          -- storage.objects.name
      AND    pp.uploaded_by  = auth.uid()
    )
  );

-- Staff and owner can read all payment proofs (for verification workflow)
CREATE POLICY "payment_proofs_objects_select_staff_owner"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'payment-proofs'
    AND public.auth_role() IN ('staff', 'owner')
  );

-- Only owner can delete payment proof files
-- (proofs should generally be retained for audit purposes)
CREATE POLICY "payment_proofs_objects_delete_owner"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'payment-proofs'
    AND public.auth_role() = 'owner'
  );
