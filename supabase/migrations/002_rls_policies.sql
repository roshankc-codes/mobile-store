-- =============================================================================
-- Migration 002: Row Level Security Policies
-- Mobile Store E-Commerce Platform
-- =============================================================================
-- RLS is mandatory on every exposed application table.
-- Security is enforced here — hiding a UI element is not sufficient.
-- The service-role key bypasses RLS; it must never be exposed to clients.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- Helper: read the current user's role from profiles.
-- STABLE: the result is constant within a single SQL statement execution.
-- SECURITY DEFINER: can read profiles even when profiles itself is RLS-locked.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.auth_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;


-- ===========================================================================
-- profiles
-- ===========================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Customers read their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Staff and owner can read all profiles
CREATE POLICY "profiles_select_staff_owner" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.auth_role() IN ('staff', 'owner'));

-- Customers can update permitted fields on their own profile.
-- WITH CHECK prevents them from elevating their own role.
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid() AND public.auth_role() = 'customer')
  WITH CHECK (
    id   = auth.uid()
    AND  role = 'customer'  -- customer cannot change their own role
  );

-- Owners can update any profile (including role changes)
CREATE POLICY "profiles_update_owner" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.auth_role() = 'owner');


-- ===========================================================================
-- categories
-- ===========================================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Public can read active categories
CREATE POLICY "categories_select_public" ON public.categories
  FOR SELECT
  USING (is_active = TRUE);

-- Staff and owner can read all (including inactive)
CREATE POLICY "categories_select_staff_owner" ON public.categories
  FOR SELECT
  TO authenticated
  USING (public.auth_role() IN ('staff', 'owner'));

-- Only owner manages categories
CREATE POLICY "categories_insert_owner" ON public.categories
  FOR INSERT
  TO authenticated
  WITH CHECK (public.auth_role() = 'owner');

CREATE POLICY "categories_update_owner" ON public.categories
  FOR UPDATE
  TO authenticated
  USING (public.auth_role() = 'owner');

CREATE POLICY "categories_delete_owner" ON public.categories
  FOR DELETE
  TO authenticated
  USING (public.auth_role() = 'owner');


-- ===========================================================================
-- brands
-- ===========================================================================
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brands_select_public" ON public.brands
  FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "brands_select_staff_owner" ON public.brands
  FOR SELECT
  TO authenticated
  USING (public.auth_role() IN ('staff', 'owner'));

CREATE POLICY "brands_insert_owner" ON public.brands
  FOR INSERT
  TO authenticated
  WITH CHECK (public.auth_role() = 'owner');

CREATE POLICY "brands_update_owner" ON public.brands
  FOR UPDATE
  TO authenticated
  USING (public.auth_role() = 'owner');

CREATE POLICY "brands_delete_owner" ON public.brands
  FOR DELETE
  TO authenticated
  USING (public.auth_role() = 'owner');


-- ===========================================================================
-- products
-- ===========================================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Public reads only active products
CREATE POLICY "products_select_public" ON public.products
  FOR SELECT
  USING (is_active = TRUE);

-- Staff / owner see everything including inactive
CREATE POLICY "products_select_staff_owner" ON public.products
  FOR SELECT
  TO authenticated
  USING (public.auth_role() IN ('staff', 'owner'));

-- Only owner modifies products (prices, stock, catalog)
CREATE POLICY "products_insert_owner" ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (public.auth_role() = 'owner');

CREATE POLICY "products_update_owner" ON public.products
  FOR UPDATE
  TO authenticated
  USING (public.auth_role() = 'owner');

CREATE POLICY "products_delete_owner" ON public.products
  FOR DELETE
  TO authenticated
  USING (public.auth_role() = 'owner');


-- ===========================================================================
-- product_media
-- ===========================================================================
ALTER TABLE public.product_media ENABLE ROW LEVEL SECURITY;

-- Public can read product media
CREATE POLICY "product_media_select_public" ON public.product_media
  FOR SELECT
  USING (TRUE);

CREATE POLICY "product_media_insert_owner" ON public.product_media
  FOR INSERT
  TO authenticated
  WITH CHECK (public.auth_role() = 'owner');

CREATE POLICY "product_media_update_owner" ON public.product_media
  FOR UPDATE
  TO authenticated
  USING (public.auth_role() = 'owner');

CREATE POLICY "product_media_delete_owner" ON public.product_media
  FOR DELETE
  TO authenticated
  USING (public.auth_role() = 'owner');


-- ===========================================================================
-- inventory
-- Customers must never see raw inventory counts directly.
-- Stock availability is surfaced through product queries only.
-- ===========================================================================
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Staff can read inventory for operational use
CREATE POLICY "inventory_select_staff_owner" ON public.inventory
  FOR SELECT
  TO authenticated
  USING (public.auth_role() IN ('staff', 'owner'));

-- No direct INSERT/UPDATE/DELETE from any client.
-- All inventory changes go through the adjust_inventory() / checkout()
-- SECURITY DEFINER functions in migration 003/004.


-- ===========================================================================
-- inventory_transactions  (append-only ledger)
-- ===========================================================================
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Staff and owner can audit the ledger
CREATE POLICY "inv_tx_select_staff_owner" ON public.inventory_transactions
  FOR SELECT
  TO authenticated
  USING (public.auth_role() IN ('staff', 'owner'));

-- No direct client inserts — managed only by SECURITY DEFINER functions.


-- ===========================================================================
-- coupons
-- Customers never query the coupons table directly.
-- Coupon validation happens inside the checkout() SECURITY DEFINER function.
-- ===========================================================================
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coupons_select_staff_owner" ON public.coupons
  FOR SELECT
  TO authenticated
  USING (public.auth_role() IN ('staff', 'owner'));

CREATE POLICY "coupons_insert_owner" ON public.coupons
  FOR INSERT
  TO authenticated
  WITH CHECK (public.auth_role() = 'owner');

CREATE POLICY "coupons_update_owner" ON public.coupons
  FOR UPDATE
  TO authenticated
  USING (public.auth_role() = 'owner');

CREATE POLICY "coupons_delete_owner" ON public.coupons
  FOR DELETE
  TO authenticated
  USING (public.auth_role() = 'owner');


-- ===========================================================================
-- orders
-- ===========================================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Authenticated customers see only their own orders
CREATE POLICY "orders_select_own" ON public.orders
  FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

-- Staff and owner see all orders
CREATE POLICY "orders_select_staff_owner" ON public.orders
  FOR SELECT
  TO authenticated
  USING (public.auth_role() IN ('staff', 'owner'));

-- Orders are created by the checkout() SECURITY DEFINER function — no direct insert.

-- Staff can update order_status and payment_status (operational actions)
CREATE POLICY "orders_update_staff" ON public.orders
  FOR UPDATE
  TO authenticated
  USING (public.auth_role() = 'staff')
  WITH CHECK (
    public.auth_role() = 'staff'
    -- Customers cannot write payment_status, order_status, total_amount, etc.
    -- The WITH CHECK here does not restrict which columns change — that must
    -- be enforced at the application / Route Handler level.
    -- For defense-in-depth the checkout SECURITY DEFINER function is the only
    -- path for creating new orders.
  );

CREATE POLICY "orders_update_owner" ON public.orders
  FOR UPDATE
  TO authenticated
  USING (public.auth_role() = 'owner');


-- ===========================================================================
-- order_items
-- ===========================================================================
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Customers see items for their own orders only
CREATE POLICY "order_items_select_own" ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE id = order_items.order_id
      AND   customer_id = auth.uid()
    )
  );

-- Staff and owner see all
CREATE POLICY "order_items_select_staff_owner" ON public.order_items
  FOR SELECT
  TO authenticated
  USING (public.auth_role() IN ('staff', 'owner'));

-- Created only by the checkout() function — no direct client insert.


-- ===========================================================================
-- payments
-- ===========================================================================
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Customers see payments for their own orders
CREATE POLICY "payments_select_own" ON public.payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE id = payments.order_id
      AND   customer_id = auth.uid()
    )
  );

-- Staff and owner see all payments
CREATE POLICY "payments_select_staff_owner" ON public.payments
  FOR SELECT
  TO authenticated
  USING (public.auth_role() IN ('staff', 'owner'));

-- Staff and owner can update payment status (verification workflow)
CREATE POLICY "payments_update_staff_owner" ON public.payments
  FOR UPDATE
  TO authenticated
  USING (public.auth_role() IN ('staff', 'owner'));

-- No direct client insert — payments are created by checkout().


-- ===========================================================================
-- payment_proofs
-- Customers must not access another customer's payment proof.
-- ===========================================================================
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;

-- Customers can upload a proof for their own order's payment
CREATE POLICY "payment_proofs_insert_own" ON public.payment_proofs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM   public.payments p
      JOIN   public.orders   o ON o.id = p.order_id
      WHERE  p.id = payment_proofs.payment_id
      AND    o.customer_id = auth.uid()
    )
    AND uploaded_by = auth.uid()
  );

-- Customers can read proofs they themselves uploaded
CREATE POLICY "payment_proofs_select_own" ON public.payment_proofs
  FOR SELECT
  TO authenticated
  USING (uploaded_by = auth.uid());

-- Staff and owner can read all payment proofs (for verification)
CREATE POLICY "payment_proofs_select_staff_owner" ON public.payment_proofs
  FOR SELECT
  TO authenticated
  USING (public.auth_role() IN ('staff', 'owner'));


-- ===========================================================================
-- coupon_usages
-- ===========================================================================
ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;

-- Customers see their own coupon usage history
CREATE POLICY "coupon_usages_select_own" ON public.coupon_usages
  FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

-- Staff and owner see all
CREATE POLICY "coupon_usages_select_staff_owner" ON public.coupon_usages
  FOR SELECT
  TO authenticated
  USING (public.auth_role() IN ('staff', 'owner'));

-- Inserts only via checkout() — no direct client insert.


-- ===========================================================================
-- banners
-- ===========================================================================
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Public reads active banners
CREATE POLICY "banners_select_public" ON public.banners
  FOR SELECT
  USING (is_active = TRUE);

-- Staff and owner see all banners (including inactive)
CREATE POLICY "banners_select_staff_owner" ON public.banners
  FOR SELECT
  TO authenticated
  USING (public.auth_role() IN ('staff', 'owner'));

CREATE POLICY "banners_insert_staff_owner" ON public.banners
  FOR INSERT
  TO authenticated
  WITH CHECK (public.auth_role() IN ('staff', 'owner'));

CREATE POLICY "banners_update_staff_owner" ON public.banners
  FOR UPDATE
  TO authenticated
  USING (public.auth_role() IN ('staff', 'owner'));

CREATE POLICY "banners_delete_owner" ON public.banners
  FOR DELETE
  TO authenticated
  USING (public.auth_role() = 'owner');


-- ===========================================================================
-- shipping_zones and shipping_rates
-- The server determines the final delivery charge.
-- ===========================================================================
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shipping_zones_select_public" ON public.shipping_zones
  FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "shipping_zones_select_staff_owner" ON public.shipping_zones
  FOR SELECT
  TO authenticated
  USING (public.auth_role() IN ('staff', 'owner'));

CREATE POLICY "shipping_zones_write_owner" ON public.shipping_zones
  FOR ALL
  TO authenticated
  USING (public.auth_role() = 'owner')
  WITH CHECK (public.auth_role() = 'owner');


ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shipping_rates_select_public" ON public.shipping_rates
  FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "shipping_rates_select_staff_owner" ON public.shipping_rates
  FOR SELECT
  TO authenticated
  USING (public.auth_role() IN ('staff', 'owner'));

CREATE POLICY "shipping_rates_write_owner" ON public.shipping_rates
  FOR ALL
  TO authenticated
  USING (public.auth_role() = 'owner')
  WITH CHECK (public.auth_role() = 'owner');


-- ===========================================================================
-- order_status_history
-- ===========================================================================
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- Customers can see status history for their own orders
CREATE POLICY "order_status_history_select_own" ON public.order_status_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE id = order_status_history.order_id
      AND   customer_id = auth.uid()
    )
  );

CREATE POLICY "order_status_history_select_staff_owner" ON public.order_status_history
  FOR SELECT
  TO authenticated
  USING (public.auth_role() IN ('staff', 'owner'));

-- Rows inserted by SECURITY DEFINER functions and trusted server code only.
CREATE POLICY "order_status_history_insert_staff_owner" ON public.order_status_history
  FOR INSERT
  TO authenticated
  WITH CHECK (public.auth_role() IN ('staff', 'owner'));


-- ===========================================================================
-- audit_logs  (append-only, no updates or deletes)
-- ===========================================================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Staff and owner can read the audit trail
CREATE POLICY "audit_logs_select_staff_owner" ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (public.auth_role() IN ('staff', 'owner'));

-- Server-side code inserts audit records; no direct client insert allowed.


-- ===========================================================================
-- email_events  (operational log, no direct client access)
-- ===========================================================================
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_events_select_staff_owner" ON public.email_events
  FOR SELECT
  TO authenticated
  USING (public.auth_role() IN ('staff', 'owner'));

-- Rows inserted by trusted server-side email processing only.
