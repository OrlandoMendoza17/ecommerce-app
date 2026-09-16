-- =============================================================================
-- MIGRACIÓN: reembolso de pedidos (refunded_at, refund_reason, RPC refund_order)
-- =============================================================================
-- Ejecutar en Supabase → SQL Editor → Run.
--
-- Qué hace:
--   Añade refunded_at y refund_reason a orders.
--   Crea/reemplaza refund_order para reembolsos admin (stock + product_stats).
--
-- Qué NO hace:
--   No cambia filas existentes ni payment_status.
--
-- Idempotente.
-- =============================================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS refund_reason TEXT NOT NULL DEFAULT '';

CREATE OR REPLACE FUNCTION public.refund_order(
  p_order_id      UUID,
  p_admin_user_id UUID,
  p_reason        TEXT DEFAULT ''
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

  IF v_order.status NOT IN ('payment_confirmed', 'shipped', 'delivered') THEN
    RAISE EXCEPTION 'Este pedido no se puede reembolsar (estado: %)', v_order.status
      USING ERRCODE = 'P0003';
  END IF;

  FOR v_item IN
    SELECT oi.variant_id, oi.quantity
      FROM public.order_items oi
     WHERE oi.order_id = p_order_id
       AND oi.variant_id IS NOT NULL
  LOOP
    UPDATE public.product_variants pv
       SET stock_quantity = pv.stock_quantity + v_item.quantity,
           updated_at     = NOW()
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
    UPDATE public.product_stats ps
       SET total_sales   = GREATEST(0, ps.total_sales - v_item.total_qty),
           total_revenue = GREATEST(0, ps.total_revenue - v_item.total_rev),
           updated_at    = NOW()
     WHERE ps.product_id = v_item.product_id;
  END LOOP;

  UPDATE public.orders o
     SET status         = 'refunded',
         refunded_at    = NOW(),
         refund_reason  = TRIM(COALESCE(p_reason, '')),
         updated_at     = NOW()
   WHERE o.id = p_order_id;

  RETURN QUERY
    SELECT o.id, o.order_number
      FROM public.orders o
     WHERE o.id = p_order_id;
END;
$$;

COMMENT ON FUNCTION public.refund_order(UUID, UUID, TEXT) IS
  'Admin registra reembolso de pedido cobrado: restaura stock y revierte product_stats.';
