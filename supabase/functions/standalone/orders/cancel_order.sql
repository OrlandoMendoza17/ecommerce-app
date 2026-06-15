-- @type standalone
-- @entity orders
-- Cancela un pedido y libera reservas de stock si aún no se confirmó el pago.

CREATE OR REPLACE FUNCTION public.cancel_order(
  p_order_id      UUID,
  p_actor_user_id UUID
)
RETURNS TABLE (id UUID, order_number TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_order   RECORD;
  v_item    RECORD;
  v_is_admin BOOLEAN;
BEGIN
  SELECT o.id, o.profile_id, o.status, o.order_number
    INTO v_order
    FROM public.orders o
   WHERE o.id = p_order_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido no encontrado'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT EXISTS (
    SELECT 1
      FROM public.profiles p
     WHERE p.id = p_actor_user_id
       AND p.is_admin = TRUE
       AND p.deleted_at IS NULL
  ) INTO v_is_admin;

  IF v_order.profile_id <> p_actor_user_id AND NOT v_is_admin THEN
    RAISE EXCEPTION 'No tienes acceso a este pedido'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_order.status NOT IN ('pending_payment', 'payment_submitted') THEN
    RAISE EXCEPTION 'Este pedido no se puede cancelar (estado: %)', v_order.status
      USING ERRCODE = 'P0003';
  END IF;

  FOR v_item IN
    SELECT oi.variant_id, oi.quantity
      FROM public.order_items oi
     WHERE oi.order_id = p_order_id
       AND oi.variant_id IS NOT NULL
  LOOP
    UPDATE public.product_variants pv
       SET reserved_quantity = GREATEST(0, pv.reserved_quantity - v_item.quantity),
           updated_at = NOW()
     WHERE pv.id = v_item.variant_id;
  END LOOP;

  UPDATE public.orders o
     SET status         = 'cancelled',
         payment_status = CASE
           WHEN o.payment_status = 'submitted' THEN 'failed'
           ELSE o.payment_status
         END,
         updated_at     = NOW()
   WHERE o.id = p_order_id;

  RETURN QUERY
    SELECT o.id, o.order_number
      FROM public.orders o
     WHERE o.id = p_order_id;
END;
$$;

COMMENT ON FUNCTION public.cancel_order(UUID, UUID) IS
  'Cancela pedido pendiente o con pago reportado y libera reservas de stock.';
