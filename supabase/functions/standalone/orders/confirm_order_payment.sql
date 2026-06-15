-- @type standalone
-- @entity orders
-- Admin confirma el pago: descuenta stock físico y cierra la reserva.

CREATE OR REPLACE FUNCTION public.confirm_order_payment(
  p_order_id      UUID,
  p_admin_user_id UUID
)
RETURNS TABLE (id UUID, order_number TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_order RECORD;
  v_item  RECORD;
  v_is_admin BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
      FROM public.profiles p
     WHERE p.id = p_admin_user_id
       AND p.is_admin = TRUE
       AND p.deleted_at IS NULL
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'No autorizado'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT o.id, o.status, o.order_number
    INTO v_order
    FROM public.orders o
   WHERE o.id = p_order_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido no encontrado'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_order.status <> 'payment_submitted' THEN
    RAISE EXCEPTION 'Solo se puede confirmar un pedido con pago reportado (estado: %)', v_order.status
      USING ERRCODE = 'P0003';
  END IF;

  FOR v_item IN
    SELECT oi.variant_id, oi.quantity, oi.product_id, oi.subtotal
      FROM public.order_items oi
     WHERE oi.order_id = p_order_id
       AND oi.variant_id IS NOT NULL
  LOOP
    UPDATE public.product_variants pv
       SET reserved_quantity = GREATEST(0, pv.reserved_quantity - v_item.quantity),
           stock_quantity    = GREATEST(0, pv.stock_quantity - v_item.quantity),
           updated_at        = NOW()
     WHERE pv.id = v_item.variant_id;
  END LOOP;

  FOR v_item IN
    SELECT oi.product_id,
           SUM(oi.quantity) AS total_qty,
           SUM(oi.subtotal) AS total_rev
      FROM public.order_items oi
     WHERE oi.order_id = p_order_id
     GROUP BY oi.product_id
  LOOP
    INSERT INTO public.product_stats (product_id, total_sales, total_revenue, updated_at)
    VALUES (v_item.product_id, v_item.total_qty, v_item.total_rev, NOW())
    ON CONFLICT (product_id) DO UPDATE
       SET total_sales   = public.product_stats.total_sales + EXCLUDED.total_sales,
           total_revenue = public.product_stats.total_revenue + EXCLUDED.total_revenue,
           updated_at    = NOW();
  END LOOP;

  UPDATE public.orders o
     SET status         = 'payment_confirmed',
         payment_status = 'confirmed',
         paid_at        = NOW(),
         updated_at     = NOW()
   WHERE o.id = p_order_id;

  RETURN QUERY
    SELECT o.id, o.order_number
      FROM public.orders o
     WHERE o.id = p_order_id;
END;
$$;

COMMENT ON FUNCTION public.confirm_order_payment(UUID, UUID) IS
  'Admin confirma pago reportado: descuenta stock y actualiza product_stats.';
