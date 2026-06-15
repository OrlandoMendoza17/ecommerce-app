-- @type standalone
-- @entity orders
-- Cancela pedidos sin pago reportado que superaron el plazo y libera reservas.

CREATE OR REPLACE FUNCTION public.expire_pending_orders(
  p_hours INTEGER DEFAULT 48
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_item  RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR v_order IN
    SELECT o.id
      FROM public.orders o
     WHERE o.status = 'pending_payment'
       AND o.created_at < NOW() - (p_hours || ' hours')::INTERVAL
     FOR UPDATE
  LOOP
    FOR v_item IN
      SELECT oi.variant_id, oi.quantity
        FROM public.order_items oi
       WHERE oi.order_id = v_order.id
         AND oi.variant_id IS NOT NULL
    LOOP
      UPDATE public.product_variants pv
         SET reserved_quantity = GREATEST(0, pv.reserved_quantity - v_item.quantity),
             updated_at = NOW()
       WHERE pv.id = v_item.variant_id;
    END LOOP;

    UPDATE public.orders o
       SET status = 'cancelled',
           updated_at = NOW()
     WHERE o.id = v_order.id;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION public.expire_pending_orders(INTEGER) IS
  'Cancela pedidos en pending_payment expirados y libera reservas de stock.';
