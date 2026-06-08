-- @type standalone
-- @entity orders
-- Proceso atómico de registro de pago:
--   1. Valida la orden (pending + propietario)
--   2. Valida el método de pago
--   3. Valida stock de cada variante
--   4. Actualiza orders (status, payment_status, datos de pago)
--   5. Descuenta stock en product_variants
--   6. Actualiza/crea product_stats (total_sales, total_revenue)
--
-- SECURITY DEFINER: necesario porque el cliente no tiene UPDATE sobre
-- product_variants ni product_stats por RLS.

CREATE OR REPLACE FUNCTION public.submit_order_payment(
  p_order_id          UUID,
  p_user_id           UUID,
  p_payment_method_id UUID,
  p_payment_reference TEXT,
  p_payment_date      DATE,
  p_issuer_bank       TEXT,
  p_payment_proof_url TEXT DEFAULT ''
)
RETURNS TABLE (id UUID, order_number TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_order         RECORD;
  v_method        RECORD;
  v_item          RECORD;
  v_variant       RECORD;
  v_customer_notes TEXT;
  v_paid_at        TIMESTAMPTZ;
BEGIN
  -- ── 1. Validar orden ─────────────────────────────────────────────────────
  SELECT o.id, o.profile_id, o.status, o.customer_notes
    INTO v_order
    FROM public.orders o
   WHERE o.id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido no encontrado: %', p_order_id
      USING ERRCODE = 'P0001';
  END IF;

  IF v_order.profile_id <> p_user_id THEN
    RAISE EXCEPTION 'No tienes acceso a este pedido'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_order.status <> 'pending' THEN
    RAISE EXCEPTION 'Este pedido ya no acepta datos de pago (estado: %)', v_order.status
      USING ERRCODE = 'P0003';
  END IF;

  -- ── 2. Validar método de pago ─────────────────────────────────────────────
  SELECT m.id, m.is_active
    INTO v_method
    FROM public.payment_methods m
   WHERE m.id = p_payment_method_id
     AND m.deleted_at IS NULL;

  IF NOT FOUND OR NOT v_method.is_active THEN
    RAISE EXCEPTION 'Método de pago no válido o inactivo'
      USING ERRCODE = 'P0004';
  END IF;

  -- ── 3 & 4. Leer order_items y validar stock ───────────────────────────────
  FOR v_item IN
    SELECT oi.product_id, oi.variant_id, oi.quantity, oi.subtotal
      FROM public.order_items oi
     WHERE oi.order_id = p_order_id
  LOOP
    IF v_item.variant_id IS NOT NULL THEN
      SELECT pv.stock_quantity, pv.allow_backorder
        INTO v_variant
        FROM public.product_variants pv
       WHERE pv.id = v_item.variant_id;

      IF FOUND AND NOT v_variant.allow_backorder AND v_variant.stock_quantity < v_item.quantity THEN
        RAISE EXCEPTION 'Stock insuficiente para la variante % (disponible: %, solicitado: %)',
          v_item.variant_id, v_variant.stock_quantity, v_item.quantity
          USING ERRCODE = 'P0005';
      END IF;
    END IF;
  END LOOP;

  -- ── 5. UPDATE orders ──────────────────────────────────────────────────────
  v_paid_at := (p_payment_date::TEXT || 'T12:00:00+00:00')::TIMESTAMPTZ;

  v_customer_notes := CASE
    WHEN v_order.customer_notes IS NOT NULL AND trim(v_order.customer_notes) <> ''
      THEN trim(v_order.customer_notes) || E'\nBanco emisor: ' || p_issuer_bank
    ELSE
      'Banco emisor: ' || p_issuer_bank
  END;

  UPDATE public.orders
     SET status              = 'payment_confirmed',
         payment_status      = 'confirmed',
         payment_method_id   = p_payment_method_id,
         payment_reference   = trim(p_payment_reference),
         payment_proof_url   = COALESCE(NULLIF(trim(p_payment_proof_url), ''), payment_proof_url),
         paid_at             = v_paid_at,
         customer_notes      = v_customer_notes,
         updated_at          = NOW()
   WHERE public.orders.id = p_order_id;

  -- ── 6. Descontar stock en product_variants ────────────────────────────────
  FOR v_item IN
    SELECT oi.variant_id, oi.quantity
      FROM public.order_items oi
     WHERE oi.order_id = p_order_id
       AND oi.variant_id IS NOT NULL
  LOOP
    UPDATE public.product_variants
       SET stock_quantity = GREATEST(0, stock_quantity - v_item.quantity),
           updated_at     = NOW()
     WHERE public.product_variants.id = v_item.variant_id;
  END LOOP;

  -- ── 7. UPSERT product_stats ───────────────────────────────────────────────
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

  -- ── 8. Retornar orden actualizada ─────────────────────────────────────────
  RETURN QUERY
    SELECT o.id, o.order_number
      FROM public.orders o
     WHERE o.id = p_order_id;
END;
$$;

COMMENT ON FUNCTION public.submit_order_payment(UUID, UUID, UUID, TEXT, DATE, TEXT, TEXT) IS
  'Registra el pago de una orden de forma atómica: confirma la orden, descuenta stock y actualiza product_stats.';
