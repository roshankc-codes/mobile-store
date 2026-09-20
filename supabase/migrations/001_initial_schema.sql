-- =============================================================================
-- Migration 001: Initial Schema
-- Mobile Store E-Commerce Platform
-- =============================================================================
-- Tables are created in foreign-key dependency order.
-- All monetary fields use NUMERIC(12,2). All timestamps use TIMESTAMPTZ.
-- UUID primary keys are PostgreSQL-generated via gen_random_uuid().
-- =============================================================================


-- ---------------------------------------------------------------------------
-- Shared trigger function: keep updated_at current on every UPDATE
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


-- ---------------------------------------------------------------------------
-- profiles
-- One row per auth.users entry, created automatically by trigger below.
-- Role must never be set by an untrusted client.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name  TEXT,
  email      TEXT,
  phone      TEXT,
  avatar_url TEXT,
  role       TEXT        NOT NULL DEFAULT 'customer'
                         CHECK (role IN ('customer', 'staff', 'owner')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create a customer profile when a new auth user signs up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.email,
    'customer',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  slug        TEXT        NOT NULL UNIQUE,
  description TEXT,
  image_url   TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_is_active  ON public.categories (is_active);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON public.categories (sort_order);

CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ---------------------------------------------------------------------------
-- brands
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.brands (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  slug       TEXT        NOT NULL UNIQUE,
  logo_url   TEXT,
  is_active  BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brands_is_active ON public.brands (is_active);

CREATE TRIGGER brands_updated_at
  BEFORE UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ---------------------------------------------------------------------------
-- products
-- specifications stores flexible JSONB; validated at the application boundary.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT          NOT NULL,
  slug             TEXT          NOT NULL UNIQUE,
  sku              TEXT          NOT NULL UNIQUE,
  description      TEXT,
  specifications   JSONB,
  brand_id         UUID          REFERENCES public.brands (id) ON DELETE SET NULL,
  category_id      UUID          NOT NULL REFERENCES public.categories (id) ON DELETE RESTRICT,
  price            NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  compare_at_price NUMERIC(12,2)          CHECK (compare_at_price >= 0),
  is_active        BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_slug        ON public.products (slug);
CREATE INDEX IF NOT EXISTS idx_products_sku         ON public.products (sku);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_id    ON public.products (brand_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active   ON public.products (is_active);
CREATE INDEX IF NOT EXISTS idx_products_created_at  ON public.products (created_at);

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ---------------------------------------------------------------------------
-- product_media
-- Payment proof files must NOT use this table (see payment_proofs).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_media (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   UUID        NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  media_type   TEXT        NOT NULL CHECK (media_type IN ('image', 'video')),
  storage_path TEXT        NOT NULL,
  public_url   TEXT,
  alt_text     TEXT,
  sort_order   INTEGER     NOT NULL DEFAULT 0,
  is_primary   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_media_product_id
  ON public.product_media (product_id);
CREATE INDEX IF NOT EXISTS idx_product_media_product_id_sort_order
  ON public.product_media (product_id, sort_order);


-- ---------------------------------------------------------------------------
-- inventory  (current stock snapshot — updated atomically with transactions)
-- The append-only ledger (inventory_transactions) is the audit source.
-- The browser must never write to this table directly.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inventory (
  product_id         UUID        PRIMARY KEY REFERENCES public.products (id) ON DELETE CASCADE,
  available_quantity INTEGER     NOT NULL DEFAULT 0 CHECK (available_quantity >= 0),
  reserved_quantity  INTEGER     NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ---------------------------------------------------------------------------
-- inventory_transactions  (append-only ledger — never delete rows)
-- quantity > 0 = stock added; quantity < 0 = stock deducted.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       UUID        NOT NULL REFERENCES public.products (id) ON DELETE RESTRICT,
  transaction_type TEXT        NOT NULL
                               CHECK (transaction_type IN (
                                 'initial_stock', 'stock_received', 'stock_adjustment',
                                 'order_reserved', 'order_released', 'order_cancelled',
                                 'order_fulfilled',
                                 'return', 'damaged', 'pos_sale'
                               )),
  quantity         INTEGER     NOT NULL CHECK (quantity <> 0),
  reference_type   TEXT,
  reference_id     UUID,
  reason           TEXT,
  created_by       UUID        REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inv_tx_product_id
  ON public.inventory_transactions (product_id);
CREATE INDEX IF NOT EXISTS idx_inv_tx_reference_id
  ON public.inventory_transactions (reference_id);
CREATE INDEX IF NOT EXISTS idx_inv_tx_created_at
  ON public.inventory_transactions (created_at);


-- ---------------------------------------------------------------------------
-- coupons  (defined before orders because orders.coupon_id references this)
-- Codes are stored as-is; normalize to UPPER on insert at application level.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coupons (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  code                TEXT          NOT NULL UNIQUE,
  description         TEXT,
  discount_type       TEXT          NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value      NUMERIC(12,2) NOT NULL CHECK (discount_value > 0),
  minimum_order_value NUMERIC(12,2),
  maximum_discount    NUMERIC(12,2),
  usage_limit         INTEGER                  CHECK (usage_limit > 0),
  usage_count         INTEGER       NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
  starts_at           TIMESTAMPTZ,
  expires_at          TIMESTAMPTZ,
  is_active           BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  -- Percentage coupons must not exceed 100 %
  CONSTRAINT coupons_percentage_max
    CHECK (discount_type <> 'percentage' OR discount_value <= 100)
);

CREATE INDEX IF NOT EXISTS idx_coupons_code      ON public.coupons (code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON public.coupons (is_active);

CREATE TRIGGER coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ---------------------------------------------------------------------------
-- orders
-- order_number is a safe sequential BIGINT generated from a PostgreSQL
-- sequence. Never use MAX(order_number)+1: concurrent inserts cause duplicates.
-- customer_id is NULL for guest orders; historical details are stored inline.
-- ---------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START WITH 1000;

CREATE TABLE IF NOT EXISTS public.orders (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number    BIGINT        NOT NULL UNIQUE DEFAULT nextval('public.order_number_seq'),
  customer_id     UUID          REFERENCES public.profiles (id) ON DELETE SET NULL,
  -- Historical customer details stored inline for immutability
  customer_name   TEXT          NOT NULL,
  customer_email  TEXT,
  customer_phone  TEXT          NOT NULL,
  -- Delivery address (stored inline — never rely on current profile address)
  province        TEXT          NOT NULL,
  district        TEXT          NOT NULL,
  municipality    TEXT          NOT NULL,
  area            TEXT,
  address         TEXT          NOT NULL,
  delivery_notes  TEXT,
  -- Financials (server-calculated, never trusted from browser)
  subtotal        NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  delivery_fee    NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
  total_amount    NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
  coupon_id       UUID          REFERENCES public.coupons (id) ON DELETE SET NULL,
  payment_method  TEXT          NOT NULL
                                CHECK (payment_method IN ('cod', 'manual_qr', 'esewa', 'khalti', 'other')),
  payment_status  TEXT          NOT NULL DEFAULT 'pending'
                                CHECK (payment_status IN (
                                  'pending', 'awaiting_verification', 'verified',
                                  'rejected', 'failed', 'refunded'
                                )),
  order_status    TEXT          NOT NULL DEFAULT 'pending'
                                CHECK (order_status IN (
                                  'pending', 'payment_verification', 'confirmed',
                                  'processing', 'shipped', 'delivered', 'cancelled',
                                  'payment_rejected', 'returned', 'refund_pending', 'refunded'
                                )),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_order_number   ON public.orders (order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id    ON public.orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_status   ON public.orders (order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders (payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at     ON public.orders (created_at);

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ---------------------------------------------------------------------------
-- order_items
-- Historical product name, SKU and price are stored inline.
-- product_id is nullable so historical records survive product archival.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID          NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  product_id      UUID          REFERENCES public.products (id) ON DELETE SET NULL,
  product_name    TEXT          NOT NULL,
  sku             TEXT          NOT NULL,
  quantity        INTEGER       NOT NULL CHECK (quantity > 0),
  unit_price      NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  line_total      NUMERIC(12,2) NOT NULL CHECK (line_total >= 0),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id   ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items (product_id);


-- ---------------------------------------------------------------------------
-- payments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id           UUID          NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  payment_method     TEXT          NOT NULL
                                   CHECK (payment_method IN ('cod', 'manual_qr', 'esewa', 'khalti', 'other')),
  amount             NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  status             TEXT          NOT NULL DEFAULT 'pending'
                                   CHECK (status IN (
                                     'pending', 'awaiting_verification', 'verified',
                                     'rejected', 'failed', 'refunded'
                                   )),
  provider           TEXT,
  provider_reference TEXT,
  verified_by        UUID          REFERENCES public.profiles (id) ON DELETE SET NULL,
  verified_at        TIMESTAMPTZ,
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments (order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status   ON public.payments (status);

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ---------------------------------------------------------------------------
-- payment_proofs
-- Must be stored in the private payment-proofs storage bucket.
-- Only authorized staff/owner may read them via storage policies.
-- Customers must not access another customer's proof.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_proofs (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id        UUID        NOT NULL REFERENCES public.payments (id) ON DELETE CASCADE,
  storage_path      TEXT        NOT NULL,
  original_filename TEXT,
  mime_type         TEXT        NOT NULL,
  file_size         INTEGER     NOT NULL CHECK (file_size > 0),
  uploaded_by       UUID        REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_proofs_payment_id ON public.payment_proofs (payment_id);


-- ---------------------------------------------------------------------------
-- coupon_usages
-- Recorded atomically inside the checkout transaction.
-- One coupon per order enforced by unique constraint on order_id.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coupon_usages (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id       UUID          NOT NULL REFERENCES public.coupons (id) ON DELETE RESTRICT,
  order_id        UUID          NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  customer_id     UUID          REFERENCES public.profiles (id) ON DELETE SET NULL,
  discount_amount NUMERIC(12,2) NOT NULL CHECK (discount_amount >= 0),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  -- Prevent the same coupon being applied to the same order twice
  CONSTRAINT coupon_usages_order_unique UNIQUE (order_id)
);

CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon_id   ON public.coupon_usages (coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_order_id    ON public.coupon_usages (order_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_customer_id ON public.coupon_usages (customer_id);


-- ---------------------------------------------------------------------------
-- banners
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.banners (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  description TEXT,
  image_path  TEXT        NOT NULL,
  link_url    TEXT,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  starts_at   TIMESTAMPTZ,
  ends_at     TIMESTAMPTZ,
  created_by  UUID        REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_banners_is_active  ON public.banners (is_active);
CREATE INDEX IF NOT EXISTS idx_banners_sort_order ON public.banners (sort_order);
CREATE INDEX IF NOT EXISTS idx_banners_starts_at  ON public.banners (starts_at);
CREATE INDEX IF NOT EXISTS idx_banners_ends_at    ON public.banners (ends_at);

CREATE TRIGGER banners_updated_at
  BEFORE UPDATE ON public.banners
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ---------------------------------------------------------------------------
-- shipping_zones
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shipping_zones (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  province   TEXT,
  district   TEXT,
  is_active  BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ---------------------------------------------------------------------------
-- shipping_rates
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shipping_rates (
  id                      UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id                 UUID          NOT NULL REFERENCES public.shipping_zones (id) ON DELETE CASCADE,
  rate                    NUMERIC(12,2) NOT NULL CHECK (rate >= 0),
  free_shipping_threshold NUMERIC(12,2),
  is_active               BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TRIGGER shipping_rates_updated_at
  BEFORE UPDATE ON public.shipping_rates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ---------------------------------------------------------------------------
-- order_status_history  (audit trail for order state changes)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID        NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status      TEXT        NOT NULL,
  changed_by      UUID        REFERENCES public.profiles (id) ON DELETE SET NULL,
  note            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id
  ON public.order_status_history (order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at
  ON public.order_status_history (created_at);


-- ---------------------------------------------------------------------------
-- audit_logs
-- Append-only. Must not store passwords, API keys or credentials.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID        REFERENCES public.profiles (id) ON DELETE SET NULL,
  action      TEXT        NOT NULL,
  entity_type TEXT        NOT NULL,
  entity_id   UUID,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id    ON public.audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs (entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id   ON public.audit_logs (entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at  ON public.audit_logs (created_at);


-- ---------------------------------------------------------------------------
-- email_events
-- Operational log only. Must not control order state.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_events (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID        REFERENCES public.orders (id) ON DELETE SET NULL,
  recipient_email     TEXT        NOT NULL,
  email_type          TEXT        NOT NULL,
  status              TEXT        NOT NULL,
  provider_message_id TEXT,
  error_message       TEXT,
  sent_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_events_order_id ON public.email_events (order_id);
