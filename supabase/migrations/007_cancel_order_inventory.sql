-- =============================================================================
-- Migration 007: Order Cancellation & Fulfillment Inventory Restoration
-- Mobile Store E-Commerce Platform
-- =============================================================================
-- Updates public.update_order_status() to atomically manage inventory:
-- 1. When an order is cancelled:
--    - Locks affected inventory rows in deterministic product_id order
--    - Moves quantity from reserved_quantity back to available_quantity
--    - Records 'order_cancelled' ledger transaction with positive quantity
-- 2. When an order is delivered:
--    - Locks affected inventory rows in deterministic product_id order
--    - Deducts quantity from reserved_quantity (stock permanently leaves warehouse)
--    - Records 'order_fulfilled' ledger transaction with negative quantity
-- 3. Idempotency & Safety:
--    - Order row locked with FOR UPDATE
--    - Rejects transitions from terminal states ('delivered', 'refunded', 'cancelled')
--    - Prevents double restoration
-- =============================================================================

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
  v_item           RECORD;
BEGIN
  -- 1. Authorization: strictly staff or owner
  IF public.auth_role() NOT IN ('staff', 'owner') THEN
    RAISE EXCEPTION 'Permission denied: update_order_status requires staff or owner role';
  END IF;

  v_actor_id := auth.uid();

  -- 2. Lock the order row
  SELECT order_status
  INTO   v_current_status
  FROM   public.orders
  WHERE  id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % not found', p_order_id;
  END IF;

  -- 3. Reject terminal orders (delivered, refunded, cancelled)
  IF v_current_status IN ('delivered', 'refunded', 'cancelled') THEN
    RAISE EXCEPTION
      'Order % is in a terminal state (%) and cannot be updated',
      p_order_id, v_current_status;
  END IF;

  -- If status isn't changing, return early
  IF v_current_status = p_new_status THEN
    RETURN;
  END IF;

  -- 4. When transitioning an order to cancelled: restore reserved inventory to available stock
  IF p_new_status = 'cancelled' THEN
    -- Lock inventory rows in deterministic order to prevent deadlocks
    PERFORM 1
    FROM public.inventory i
    WHERE i.product_id IN (
      SELECT oi.product_id
      FROM public.order_items oi
      WHERE oi.order_id = p_order_id
    )
    ORDER BY i.product_id
    FOR UPDATE;

    FOR v_item IN
      SELECT product_id, quantity
      FROM public.order_items
      WHERE order_id = p_order_id
      ORDER BY product_id
    LOOP
      -- Move reserved -> available
      UPDATE public.inventory
      SET
        available_quantity = available_quantity + v_item.quantity,
        reserved_quantity  = GREATEST(0, reserved_quantity - v_item.quantity),
        updated_at         = NOW()
      WHERE product_id = v_item.product_id;

      -- Append to inventory ledger using required 'order_cancelled' type
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
        v_item.product_id,
        'order_cancelled',
        v_item.quantity,   -- positive: stock returning to available
        'order',
        p_order_id,
        COALESCE(p_note, 'Order cancelled by staff'),
        v_actor_id,
        NOW()
      );
    END LOOP;
  END IF;

  -- 5. When transitioning an order to delivered: deduct reserved stock permanently
  IF p_new_status = 'delivered' THEN
    -- Lock inventory rows in deterministic order
    PERFORM 1
    FROM public.inventory i
    WHERE i.product_id IN (
      SELECT oi.product_id
      FROM public.order_items oi
      WHERE oi.order_id = p_order_id
    )
    ORDER BY i.product_id
    FOR UPDATE;

    FOR v_item IN
      SELECT product_id, quantity
      FROM public.order_items
      WHERE order_id = p_order_id
      ORDER BY product_id
    LOOP
      UPDATE public.inventory
      SET
        reserved_quantity = GREATEST(0, reserved_quantity - v_item.quantity),
        updated_at        = NOW()
      WHERE product_id = v_item.product_id;

      -- Append to inventory ledger using historical 'order_fulfilled' type
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
        v_item.product_id,
        'order_fulfilled',
        -v_item.quantity,  -- negative: stock permanently leaving warehouse
        'order',
        p_order_id,
        COALESCE(p_note, 'Order fulfilled / delivered'),
        v_actor_id,
        NOW()
      );
    END LOOP;
  END IF;

  -- 6. Update order status
  UPDATE public.orders
  SET
    order_status = p_new_status,
    updated_at   = NOW()
  WHERE id = p_order_id;

  -- 7. Record history in audit table
  INSERT INTO public.order_status_history (
    order_id,
    previous_status,
    new_status,
    changed_by,
    note,
    created_at
  ) VALUES (
    p_order_id,
    v_current_status,
    p_new_status,
    v_actor_id,
    p_note,
    NOW()
  );
END;
$$;

-- Restrict execution to authenticated users (role check inside function restricts to staff/owner)
REVOKE EXECUTE ON FUNCTION public.update_order_status(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_order_status(UUID, TEXT, TEXT) TO authenticated;
