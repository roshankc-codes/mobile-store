-- =============================================================================
-- Migration 003: Inventory Control Functions
-- Mobile Store E-Commerce Platform
-- =============================================================================
-- All stock mutations go through these SECURITY DEFINER functions.
-- No direct INSERT/UPDATE on inventory or inventory_transactions from clients.
--
-- Invariants enforced here:
--   1. Authorization validated by caller role (checked inside function)
--   2. Inventory row locked with FOR UPDATE before any read/write
--   3. Resulting available_quantity is validated >= 0 before committing
--   4. inventory snapshot and inventory_transactions entry are written
--      in the same statement batch (atomic, no partial updates)
--   5. quantity must be non-zero (enforced by table CHECK constraint)
-- =============================================================================


-- ---------------------------------------------------------------------------
-- adjust_inventory
--
-- General-purpose inventory adjustment called by staff/owner for:
--   initial_stock, stock_received, stock_adjustment, return, damaged, etc.
--
-- p_quantity > 0  = stock addition
-- p_quantity < 0  = stock deduction
--
-- Raises an exception if the adjustment would result in negative stock.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.adjust_inventory(
  p_product_id UUID,
  p_quantity    INTEGER,
  p_tx_type     TEXT,
  p_ref_type    TEXT    DEFAULT NULL,
  p_ref_id      UUID    DEFAULT NULL,
  p_reason      TEXT    DEFAULT NULL,
  p_actor_id    UUID    DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current INTEGER;
BEGIN
  -- Authorization: only staff or owner may call this function
  IF public.auth_role() NOT IN ('staff', 'owner') THEN
    RAISE EXCEPTION 'Permission denied: adjust_inventory requires staff or owner role';
  END IF;

  IF p_quantity = 0 THEN
    RAISE EXCEPTION 'quantity must be non-zero';
  END IF;

  -- Step 2: Lock the inventory row to prevent concurrent race conditions
  SELECT available_quantity
  INTO   v_current
  FROM   public.inventory
  WHERE  product_id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inventory record not found for product %', p_product_id;
  END IF;

  -- Step 3: Validate resulting quantity
  IF v_current + p_quantity < 0 THEN
    RAISE EXCEPTION
      'Insufficient stock for product %. Available: %, requested change: %',
      p_product_id, v_current, p_quantity;
  END IF;

  -- Step 4: Update inventory snapshot
  UPDATE public.inventory
  SET
    available_quantity = available_quantity + p_quantity,
    updated_at         = NOW()
  WHERE product_id = p_product_id;

  -- Step 5: Append to the append-only ledger (atomically in same transaction)
  INSERT INTO public.inventory_transactions (
    product_id,
    transaction_type,
    quantity,
    reference_type,
    reference_id,
    reason,
    created_by,
    created_at
  ) VALUES (
    p_product_id,
    p_tx_type,
    p_quantity,
    p_ref_type,
    p_ref_id,
    p_reason,
    COALESCE(p_actor_id, auth.uid()),
    NOW()
  );
END;
$$;

-- F1: restrict execution - only authenticated users may call adjust_inventory().
-- anon is deliberately excluded: inventory adjustments always require a logged-in staff/owner
-- (the auth_role() check inside the function provides the second layer).
REVOKE EXECUTE ON FUNCTION public.adjust_inventory(UUID, INTEGER, TEXT, TEXT, UUID, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.adjust_inventory(UUID, INTEGER, TEXT, TEXT, UUID, TEXT, UUID) TO authenticated;


-- ---------------------------------------------------------------------------
-- initialize_inventory
--
-- Creates the inventory row for a newly created product.
-- Called by staff/owner after inserting a product.
-- Uses ON CONFLICT so it is safe to call again if the row already exists
-- (idempotent bootstrap).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.initialize_inventory(
  p_product_id      UUID,
  p_initial_quantity INTEGER DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.auth_role() NOT IN ('staff', 'owner') THEN
    RAISE EXCEPTION 'Permission denied: initialize_inventory requires staff or owner role';
  END IF;

  IF p_initial_quantity < 0 THEN
    RAISE EXCEPTION 'Initial quantity cannot be negative';
  END IF;

  INSERT INTO public.inventory (product_id, available_quantity, reserved_quantity, updated_at)
  VALUES (p_product_id, 0, 0, NOW())
  ON CONFLICT (product_id) DO NOTHING;

  IF p_initial_quantity > 0 THEN
    PERFORM public.adjust_inventory(
      p_product_id,
      p_initial_quantity,
      'initial_stock',
      NULL, NULL,
      'Initial stock on product creation',
      auth.uid()
    );
  END IF;
END;
$$;

-- F1: restrict execution - only authenticated users may call initialize_inventory().
REVOKE EXECUTE ON FUNCTION public.initialize_inventory(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.initialize_inventory(UUID, INTEGER) TO authenticated;


-- ---------------------------------------------------------------------------
-- release_reserved_inventory
--
-- Moves quantity from reserved back to available.
-- Called when an order is cancelled or payment rejected.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.release_reserved_inventory(
  p_product_id UUID,
  p_quantity    INTEGER,
  p_order_id    UUID,
  p_reason      TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reserved INTEGER;
BEGIN
  IF public.auth_role() NOT IN ('staff', 'owner') THEN
    RAISE EXCEPTION 'Permission denied: release_reserved_inventory requires staff or owner role';
  END IF;

  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Release quantity must be positive';
  END IF;

  -- Lock inventory row
  SELECT reserved_quantity
  INTO   v_reserved
  FROM   public.inventory
  WHERE  product_id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inventory record not found for product %', p_product_id;
  END IF;

  IF v_reserved < p_quantity THEN
    RAISE EXCEPTION
      'Cannot release % units: only % are reserved for product %',
      p_quantity, v_reserved, p_product_id;
  END IF;

  -- Move reserved -> available
  UPDATE public.inventory
  SET
    available_quantity = available_quantity + p_quantity,
    reserved_quantity  = reserved_quantity  - p_quantity,
    updated_at         = NOW()
  WHERE product_id = p_product_id;

  -- Record in ledger
  INSERT INTO public.inventory_transactions (
    product_id,
    transaction_type,
    quantity,
    reference_type,
    reference_id,
    reason,
    created_by,
    created_at
  ) VALUES (
    p_product_id,
    'order_released',
    p_quantity,   -- positive: stock returning to available
    'order',
    p_order_id,
    COALESCE(p_reason, 'Order cancelled or payment rejected'),
    auth.uid(),
    NOW()
  );
END;
$$;

-- F1: restrict execution - only authenticated users may call release_reserved_inventory().
REVOKE EXECUTE ON FUNCTION public.release_reserved_inventory(UUID, INTEGER, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.release_reserved_inventory(UUID, INTEGER, UUID, TEXT) TO authenticated;


-- ---------------------------------------------------------------------------
-- confirm_sold_inventory
--
-- Reduces reserved_quantity when an order is fulfilled (delivered/confirmed).
-- Stock leaves the warehouse at this point.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.confirm_sold_inventory(
  p_product_id UUID,
  p_quantity    INTEGER,
  p_order_id    UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reserved INTEGER;
BEGIN
  IF public.auth_role() NOT IN ('staff', 'owner') THEN
    RAISE EXCEPTION 'Permission denied: confirm_sold_inventory requires staff or owner role';
  END IF;

  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Confirm quantity must be positive';
  END IF;

  SELECT reserved_quantity
  INTO   v_reserved
  FROM   public.inventory
  WHERE  product_id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inventory record not found for product %', p_product_id;
  END IF;

  IF v_reserved < p_quantity THEN
    RAISE EXCEPTION
      'Cannot confirm sale of % units: only % are reserved for product %',
      p_quantity, v_reserved, p_product_id;
  END IF;

  -- Deduct from reserved (stock is now shipped/sold — no longer in warehouse)
  UPDATE public.inventory
  SET
    reserved_quantity = reserved_quantity - p_quantity,
    updated_at        = NOW()
  WHERE product_id = p_product_id;

  -- Record deduction in ledger (quantity is negative = stock leaving)
  INSERT INTO public.inventory_transactions (
    product_id,
    transaction_type,
    quantity,
    reference_type,
    reference_id,
    created_by,
    created_at
  ) VALUES (
    p_product_id,
    'order_fulfilled',   -- F3: correct type for a confirmed delivery (stock leaving warehouse)
    -p_quantity,
    'order',
    p_order_id,
    auth.uid(),
    NOW()
  );
END;
$$;

-- F1: restrict execution - only authenticated users may call confirm_sold_inventory().
REVOKE EXECUTE ON FUNCTION public.confirm_sold_inventory(UUID, INTEGER, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_sold_inventory(UUID, INTEGER, UUID) TO authenticated;
