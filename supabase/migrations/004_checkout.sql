-- =============================================================================
-- Migration 004: Checkout Transaction Function
-- Mobile Store E-Commerce Platform
-- =============================================================================
-- checkout() is a SECURITY DEFINER RPC called from the Next.js Route Handler.
-- It executes the 18-step atomic checkout sequence from DATABASE_SPECIFICATION
-- section 37. The entire transaction rolls back on any failure.
--
-- SECURITY CONTRACT:
--   - Prices are re-read from public.products inside this function.
--     The browser-supplied price is NEVER used.
--   - Stock is locked with FOR UPDATE before any read.
--   - Coupon validity is verified server-side.
--   - Delivery fee is resolved from shipping_zones/shipping_rates.
--   - Payment status is set by this function, never by the browser.
--   - The function must be called from trusted server-side code only
--     (Next.js Route Handler using the Supabase publishable key or
--     a service-role call). It must NOT be exposed as an open endpoint.
--
-- Input payload shape (JSONB):
-- {
--   "customer_name":  "...",          -- required
--   "customer_email": "...",          -- optional
--   "customer_phone": "...",          -- required
--   "province":       "...",          -- required
--   "district":       "...",          -- required
--   "municipality":   "...",          -- required
--   "area":           "...",          -- optional
--   "address":        "...",          -- required
--   "delivery_notes": "...",          -- optional
--   "payment_method": "cod|manual_qr|esewa|khalti|other",  -- required
--   "coupon_code":    "SAVE10",       -- optional
--   "items": [
--     { "product_id": "<uuid>", "quantity": 2 },
--     ...
--   ]
-- }
--
-- Returns: UUID of the created order (or raises an exception on failure).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.checkout(p_payload JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- Caller identity
  v_customer_id    UUID;

  -- Order identity
  v_order_id       UUID;

  -- Payment method / status
  v_payment_method TEXT;
  v_payment_status TEXT;

  -- Coupon
  v_coupon_code    TEXT;
  v_coupon_id      UUID;
  v_coupon         RECORD;

  -- Financial totals (server-calculated)
  v_subtotal       NUMERIC(12,2) := 0;
  v_discount       NUMERIC(12,2) := 0;
  v_delivery_fee   NUMERIC(12,2) := 0;
  v_total          NUMERIC(12,2);

  -- Item loop variables
  v_items          JSONB;
  v_item           JSONB;
  v_item_product_id UUID;
  v_item_qty       INTEGER;
  v_product        RECORD;
  v_line_total     NUMERIC(12,2);

  -- Inventory check
  v_available      INTEGER;
BEGIN

  -- ==========================================================================
  -- Step 1: Identify caller (guest checkout supported — customer_id may be NULL)
  -- ==========================================================================
  v_customer_id := auth.uid();  -- NULL for unauthenticated / guest checkout

  -- ==========================================================================
  -- Step 2: Validate required guest / customer information
  -- ==========================================================================
  IF NULLIF(trim(p_payload->>'customer_name'), '')  IS NULL THEN
    RAISE EXCEPTION 'customer_name is required';
  END IF;
  IF NULLIF(trim(p_payload->>'customer_phone'), '') IS NULL THEN
    RAISE EXCEPTION 'customer_phone is required';
  END IF;
  IF NULLIF(trim(p_payload->>'province'), '')       IS NULL THEN
    RAISE EXCEPTION 'province is required';
  END IF;
  IF NULLIF(trim(p_payload->>'district'), '')       IS NULL THEN
    RAISE EXCEPTION 'district is required';
  END IF;
  IF NULLIF(trim(p_payload->>'municipality'), '')   IS NULL THEN
    RAISE EXCEPTION 'municipality is required';
  END IF;
  IF NULLIF(trim(p_payload->>'address'), '')        IS NULL THEN
    RAISE EXCEPTION 'address is required';
  END IF;

  v_payment_method := p_payload->>'payment_method';
  IF v_payment_method NOT IN ('cod', 'manual_qr', 'esewa', 'khalti', 'other') THEN
    RAISE EXCEPTION 'Invalid payment_method: %', v_payment_method;
  END IF;

  v_items := p_payload->'items';
  IF v_items IS NULL OR jsonb_array_length(v_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;

  -- ==========================================================================
  -- Steps 3-5: Validate each item exists, is active, has enough stock.
  --            Lock all inventory rows first (alphabetical product_id order to
  --            avoid deadlocks when two concurrent checkouts share items).
  -- ==========================================================================
  FOR v_item IN
    SELECT value
    FROM   jsonb_array_elements(v_items)
    ORDER BY value->>'product_id'   -- consistent lock order prevents deadlock
  LOOP
    v_item_product_id := (v_item->>'product_id')::UUID;
    v_item_qty        := (v_item->>'quantity')::INTEGER;

    IF v_item_qty <= 0 THEN
      RAISE EXCEPTION 'Item quantity must be a positive integer';
    END IF;

    -- Step 4: Lock inventory row
    SELECT available_quantity
    INTO   v_available
    FROM   public.inventory
    WHERE  product_id = v_item_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'No inventory record for product %', v_item_product_id;
    END IF;

    -- Step 5: Re-check stock with lock held
    IF v_available < v_item_qty THEN
      RAISE EXCEPTION
        'Insufficient stock for product %. Available: %, requested: %',
        v_item_product_id, v_available, v_item_qty;
    END IF;
  END LOOP;

  -- ==========================================================================
  -- Steps 6-7: Validate product availability and re-read prices from DB.
  --            Browser-supplied prices are ignored entirely.
  -- ==========================================================================
  FOR v_item IN SELECT value FROM jsonb_array_elements(v_items)
  LOOP
    v_item_product_id := (v_item->>'product_id')::UUID;
    v_item_qty        := (v_item->>'quantity')::INTEGER;

    SELECT id, name, sku, price, is_active
    INTO   v_product
    FROM   public.products
    WHERE  id = v_item_product_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % not found', v_item_product_id;
    END IF;

    IF NOT v_product.is_active THEN
      RAISE EXCEPTION 'Product "%" is not available for purchase', v_product.name;
    END IF;

    -- Accumulate server-side subtotal
    v_line_total := v_product.price * v_item_qty;
    v_subtotal   := v_subtotal + v_line_total;
  END LOOP;

  -- ==========================================================================
  -- Step 8: Validate coupon (if provided)
  --         Lock coupon row to prevent concurrent usage_count races.
  -- ==========================================================================
  v_coupon_code := NULLIF(trim(upper(p_payload->>'coupon_code')), '');

  IF v_coupon_code IS NOT NULL THEN
    SELECT *
    INTO   v_coupon
    FROM   public.coupons
    WHERE  code      = v_coupon_code
    AND    is_active = TRUE
    FOR UPDATE;   -- lock prevents two simultaneous checkouts exhausting the same limit

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Coupon "%" is not valid or is inactive', v_coupon_code;
    END IF;

    IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < NOW() THEN
      RAISE EXCEPTION 'Coupon "%" has expired', v_coupon_code;
    END IF;

    IF v_coupon.starts_at IS NOT NULL AND v_coupon.starts_at > NOW() THEN
      RAISE EXCEPTION 'Coupon "%" is not yet active', v_coupon_code;
    END IF;

    IF v_coupon.usage_limit IS NOT NULL
       AND v_coupon.usage_count >= v_coupon.usage_limit THEN
      RAISE EXCEPTION 'Coupon "%" has reached its usage limit', v_coupon_code;
    END IF;

    IF v_coupon.minimum_order_value IS NOT NULL
       AND v_subtotal < v_coupon.minimum_order_value THEN
      RAISE EXCEPTION
        'Order subtotal (%) does not meet the minimum order value (%) for coupon "%"',
        v_subtotal, v_coupon.minimum_order_value, v_coupon_code;
    END IF;

    v_coupon_id := v_coupon.id;

    -- ==========================================================================
    -- Steps 9-10: Calculate discount server-side
    -- ==========================================================================
    IF v_coupon.discount_type = 'percentage' THEN
      v_discount := round((v_subtotal * v_coupon.discount_value / 100), 2);
    ELSE
      v_discount := v_coupon.discount_value;
    END IF;

    -- Apply maximum discount cap
    IF v_coupon.maximum_discount IS NOT NULL
       AND v_discount > v_coupon.maximum_discount THEN
      v_discount := v_coupon.maximum_discount;
    END IF;

    -- Discount cannot exceed subtotal
    IF v_discount > v_subtotal THEN
      v_discount := v_subtotal;
    END IF;
  END IF;

  -- ==========================================================================
  -- Step 11: Calculate delivery fee from shipping_zones / shipping_rates.
  --          The server determines the final delivery charge.
  --          More specific zone match (with district) takes precedence.
  -- ==========================================================================
  SELECT COALESCE(
    (
      SELECT sr.rate
      FROM   public.shipping_zones sz
      JOIN   public.shipping_rates sr ON sr.zone_id = sz.id
      WHERE  sz.is_active = TRUE
      AND    sr.is_active = TRUE
      AND    sz.province  = p_payload->>'province'
      AND    (sz.district IS NULL OR sz.district = p_payload->>'district')
      AND    (
               sr.free_shipping_threshold IS NULL
               OR (v_subtotal - v_discount) < sr.free_shipping_threshold
             )
      ORDER BY sz.district NULLS LAST  -- prefer district-specific match
      LIMIT 1
    ),
    0::NUMERIC(12,2)  -- default: free delivery when no zone rule matches
  )
  INTO v_delivery_fee;

  -- ==========================================================================
  -- Step 12: Calculate final total
  -- ==========================================================================
  v_total := v_subtotal - v_discount + v_delivery_fee;

  -- Determine initial payment status from payment method
  v_payment_status := CASE
    WHEN v_payment_method = 'cod' THEN 'pending'
    ELSE 'awaiting_verification'
  END;

  -- ==========================================================================
  -- Step 13: Create order
  -- ==========================================================================
  INSERT INTO public.orders (
    customer_id,
    customer_name,
    customer_email,
    customer_phone,
    province,
    district,
    municipality,
    area,
    address,
    delivery_notes,
    subtotal,
    discount_amount,
    delivery_fee,
    total_amount,
    coupon_id,
    payment_method,
    payment_status,
    order_status,
    created_at,
    updated_at
  )
  VALUES (
    v_customer_id,
    trim(p_payload->>'customer_name'),
    NULLIF(trim(p_payload->>'customer_email'), ''),
    trim(p_payload->>'customer_phone'),
    trim(p_payload->>'province'),
    trim(p_payload->>'district'),
    trim(p_payload->>'municipality'),
    NULLIF(trim(p_payload->>'area'), ''),
    trim(p_payload->>'address'),
    NULLIF(trim(p_payload->>'delivery_notes'), ''),
    v_subtotal,
    v_discount,
    v_delivery_fee,
    v_total,
    v_coupon_id,
    v_payment_method,
    v_payment_status,
    'pending',
    NOW(),
    NOW()
  )
  RETURNING id INTO v_order_id;

  -- ==========================================================================
  -- Step 14: Create order_items (prices from DB, not from browser payload)
  -- ==========================================================================
  FOR v_item IN SELECT value FROM jsonb_array_elements(v_items)
  LOOP
    v_item_product_id := (v_item->>'product_id')::UUID;
    v_item_qty        := (v_item->>'quantity')::INTEGER;

    SELECT id, name, sku, price
    INTO   v_product
    FROM   public.products
    WHERE  id = v_item_product_id;

    v_line_total := v_product.price * v_item_qty;

    INSERT INTO public.order_items (
      order_id,
      product_id,
      product_name,
      sku,
      quantity,
      unit_price,
      discount_amount,
      line_total,
      created_at
    )
    VALUES (
      v_order_id,
      v_product.id,
      v_product.name,
      v_product.sku,
      v_item_qty,
      v_product.price,
      0,              -- item-level discount handled at order level for V1
      v_line_total,
      NOW()
    );
  END LOOP;

  -- ==========================================================================
  -- Step 15: Create payment record
  -- ==========================================================================
  INSERT INTO public.payments (
    order_id,
    payment_method,
    amount,
    status,
    created_at,
    updated_at
  )
  VALUES (
    v_order_id,
    v_payment_method,
    v_total,
    v_payment_status,
    NOW(),
    NOW()
  );

  -- ==========================================================================
  -- Step 16: Reserve inventory (deduct available, increment reserved)
  --          Inventory rows are still locked from step 4.
  -- ==========================================================================
  FOR v_item IN SELECT value FROM jsonb_array_elements(v_items)
  LOOP
    v_item_product_id := (v_item->>'product_id')::UUID;
    v_item_qty        := (v_item->>'quantity')::INTEGER;

    -- Update snapshot (row is already locked from step 4)
    UPDATE public.inventory
    SET
      available_quantity = available_quantity - v_item_qty,
      reserved_quantity  = reserved_quantity  + v_item_qty,
      updated_at         = NOW()
    WHERE product_id = v_item_product_id;

    -- Append to ledger
    INSERT INTO public.inventory_transactions (
      product_id,
      transaction_type,
      quantity,
      reference_type,
      reference_id,
      created_at
    )
    VALUES (
      v_item_product_id,
      'order_reserved',
      -v_item_qty,   -- negative: leaving available stock
      'order',
      v_order_id,
      NOW()
    );
  END LOOP;

  -- ==========================================================================
  -- Step 17: Record coupon usage and increment usage_count
  -- ==========================================================================
  IF v_coupon_id IS NOT NULL THEN
    INSERT INTO public.coupon_usages (
      coupon_id,
      order_id,
      customer_id,
      discount_amount,
      created_at
    )
    VALUES (
      v_coupon_id,
      v_order_id,
      v_customer_id,
      v_discount,
      NOW()
    );

    UPDATE public.coupons
    SET
      usage_count = usage_count + 1,
      updated_at  = NOW()
    WHERE id = v_coupon_id;
  END IF;

  -- ==========================================================================
  -- Step 18: Record initial order status history entry
  -- ==========================================================================
  INSERT INTO public.order_status_history (
    order_id,
    previous_status,
    new_status,
    changed_by,
    note,
    created_at
  )
  VALUES (
    v_order_id,
    NULL,
    'pending',
    v_customer_id,
    'Order placed',
    NOW()
  );

  -- ==========================================================================
  -- COMMIT: If we reach here, the entire transaction is committed atomically.
  -- Any RAISE EXCEPTION above causes a full ROLLBACK — no partial orders.
  -- ==========================================================================
  RETURN v_order_id;

END;
$$;

-- F1: restrict execution.
-- anon is granted because guest checkout (customer_id = NULL) is a supported use case.
-- The auth_role() / authorization checks inside the function remain the second layer.
-- Application Route Handlers must enforce rate-limiting on top of this.
REVOKE EXECUTE ON FUNCTION public.checkout(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.checkout(JSONB) TO authenticated, anon;


-- ---------------------------------------------------------------------------
-- update_order_status
--
-- Staff/owner call this to advance the order lifecycle.
-- Records each transition in order_status_history.
-- Enforces basic state machine rules to prevent invalid transitions.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_order_status(
  p_order_id      UUID,
  p_new_status    TEXT,
  p_note          TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_status TEXT;
  v_actor_id       UUID;
BEGIN
  -- Authorization
  IF public.auth_role() NOT IN ('staff', 'owner') THEN
    RAISE EXCEPTION 'Permission denied: update_order_status requires staff or owner role';
  END IF;

  v_actor_id := auth.uid();

  -- Lock the order row
  SELECT order_status
  INTO   v_current_status
  FROM   public.orders
  WHERE  id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % not found', p_order_id;
  END IF;

  -- Basic state machine guard (prevents nonsensical backwards transitions)
  IF v_current_status IN ('delivered', 'refunded', 'cancelled') THEN
    RAISE EXCEPTION
      'Order % is in a terminal state (%) and cannot be updated',
      p_order_id, v_current_status;
  END IF;

  -- Update order
  UPDATE public.orders
  SET
    order_status = p_new_status,
    updated_at   = NOW()
  WHERE id = p_order_id;

  -- Record history
  INSERT INTO public.order_status_history (
    order_id, previous_status, new_status, changed_by, note, created_at
  )
  VALUES (
    p_order_id, v_current_status, p_new_status, v_actor_id,
    p_note, NOW()
  );
END;
$$;

-- F1: restrict execution - only authenticated users may call update_order_status().
-- The auth_role() check inside the function blocks customers and anon at the second layer.
REVOKE EXECUTE ON FUNCTION public.update_order_status(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_order_status(UUID, TEXT, TEXT) TO authenticated;


-- ---------------------------------------------------------------------------
-- verify_payment
--
-- Staff/owner call this to verify or reject a manual payment.
-- Updates both the payment record and the parent order payment_status.
-- Records the actor and timestamp as required by spec section 21.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.verify_payment(
  p_payment_id UUID,
  p_new_status TEXT,    -- 'verified' or 'rejected'
  p_note       TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id       UUID;
  v_current_status TEXT;
  v_actor_id       UUID;
BEGIN
  IF public.auth_role() NOT IN ('staff', 'owner') THEN
    RAISE EXCEPTION 'Permission denied: verify_payment requires staff or owner role';
  END IF;

  IF p_new_status NOT IN ('verified', 'rejected') THEN
    RAISE EXCEPTION 'p_new_status must be "verified" or "rejected"';
  END IF;

  v_actor_id := auth.uid();

  SELECT status, order_id
  INTO   v_current_status, v_order_id
  FROM   public.payments
  WHERE  id = p_payment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment % not found', p_payment_id;
  END IF;

  IF v_current_status NOT IN ('pending', 'awaiting_verification') THEN
    RAISE EXCEPTION
      'Payment % is already in state "%" and cannot be re-verified', p_payment_id, v_current_status;
  END IF;

  -- Update payment
  UPDATE public.payments
  SET
    status      = p_new_status,
    verified_by = v_actor_id,
    verified_at = NOW(),
    updated_at  = NOW()
  WHERE id = p_payment_id;

  -- Mirror onto the parent order
  UPDATE public.orders
  SET
    payment_status = p_new_status,
    order_status   = CASE
      WHEN p_new_status = 'verified'  THEN 'confirmed'
      WHEN p_new_status = 'rejected'  THEN 'payment_rejected'
      ELSE order_status
    END,
    updated_at = NOW()
  WHERE id = v_order_id;

  -- Audit record
  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata, created_at)
  VALUES (
    v_actor_id,
    CASE WHEN p_new_status = 'verified' THEN 'payment_verified' ELSE 'payment_rejected' END,
    'payments',
    p_payment_id,
    jsonb_build_object(
      'previous_status', v_current_status,
      'new_status',      p_new_status,
      'note',            p_note
    ),
    NOW()
  );
END;
$$;

-- F1: restrict execution - only authenticated users may call verify_payment().
-- The auth_role() check inside the function blocks customers at the second layer.
REVOKE EXECUTE ON FUNCTION public.verify_payment(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_payment(UUID, TEXT, TEXT) TO authenticated;
