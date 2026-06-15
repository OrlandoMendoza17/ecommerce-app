-- =============================================================================
-- MIGRACIÓN: columna issuer_bank en orders
-- Ejecutar en Supabase → SQL Editor si la BD ya existe.
-- =============================================================================

-- 1. Nueva columna
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS issuer_bank TEXT NOT NULL DEFAULT '';

-- 2. Migrar datos que quedaron en customer_notes (formato antiguo)
UPDATE public.orders o
   SET issuer_bank = trim(
         regexp_replace(o.customer_notes, '^Banco emisor:\s*', '', 'i')
       ),
       customer_notes = ''
 WHERE o.customer_notes ~* '^Banco emisor:';

-- 3. Reemplazar submit_order_payment (guarda issuer_bank, ya no usa customer_notes)
-- Copiado de: supabase/functions/standalone/orders/submit_order_payment.sql

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
  v_order           RECORD;
  v_method          RECORD;
  v_currency        VARCHAR(3);
  v_exchange_rate   DECIMAL(15,4);
  v_paid_total      DECIMAL(15,2);
  v_issuer_bank     TEXT;
  v_item            RECORD;
BEGIN
  SELECT o.id, o.profile_id, o.status, o.total
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

  IF v_order.status <> 'pending_payment' THEN
    RAISE EXCEPTION 'Este pedido ya no acepta datos de pago (estado: %)', v_order.status
      USING ERRCODE = 'P0003';
  END IF;

  SELECT m.id, m.is_active, m.type
    INTO v_method
    FROM public.payment_methods m
   WHERE m.id = p_payment_method_id
     AND m.deleted_at IS NULL;

  IF NOT FOUND OR NOT v_method.is_active THEN
    RAISE EXCEPTION 'Método de pago no válido o inactivo'
      USING ERRCODE = 'P0004';
  END IF;

  v_currency := CASE lower(trim(v_method.type))
    WHEN 'pago_movil'             THEN 'VES'
    WHEN 'transferencia_bancaria' THEN 'VES'
    WHEN 'zelle'                  THEN 'USD'
    WHEN 'zinli'                  THEN 'USD'
    WHEN 'binance'                THEN 'USD'
    ELSE NULL
  END;

  IF v_currency IS NULL THEN
    RAISE EXCEPTION 'Tipo de método de pago no reconocido: %', v_method.type
      USING ERRCODE = 'P0005';
  END IF;

  IF v_currency = 'VES' THEN
    v_issuer_bank := trim(COALESCE(p_issuer_bank, ''));
    IF v_issuer_bank = '' THEN
      RAISE EXCEPTION 'El banco emisor es obligatorio para este método de pago'
        USING ERRCODE = 'P0007';
    END IF;
  ELSE
    v_issuer_bank := '';
  END IF;

  IF v_currency = 'VES' THEN
    SELECT er."USD"
      INTO v_exchange_rate
      FROM public.exchange_rates er
     ORDER BY er.created_at DESC
     LIMIT 1;

    IF NOT FOUND OR v_exchange_rate IS NULL OR v_exchange_rate = 0 THEN
      RAISE EXCEPTION 'No hay tasa de cambio disponible. Intenta más tarde.'
        USING ERRCODE = 'P0006';
    END IF;
  ELSIF v_currency = 'EUR' THEN
    SELECT er."EUR"
      INTO v_exchange_rate
      FROM public.exchange_rates er
     ORDER BY er.created_at DESC
     LIMIT 1;

    IF NOT FOUND OR v_exchange_rate IS NULL OR v_exchange_rate = 0 THEN
      RAISE EXCEPTION 'No hay tasa de cambio EUR disponible. Intenta más tarde.'
        USING ERRCODE = 'P0006';
    END IF;
  ELSE
    v_exchange_rate := 1.0;
  END IF;

  v_paid_total := ROUND(v_order.total * v_exchange_rate, 2);

  UPDATE public.orders o
     SET status                = 'payment_submitted',
         payment_status        = 'submitted',
         payment_method_id     = p_payment_method_id,
         payment_reference     = trim(p_payment_reference),
         payment_proof_url     = COALESCE(NULLIF(trim(p_payment_proof_url), ''), o.payment_proof_url),
         issuer_bank           = v_issuer_bank,
         payment_currency      = v_currency,
         payment_exchange_rate = v_exchange_rate,
         paid_total            = v_paid_total,
         updated_at            = NOW()
   WHERE o.id = p_order_id;

  FOR v_item IN
    SELECT oi.id, oi.unit_price, oi.subtotal
      FROM public.order_items oi
     WHERE oi.order_id = p_order_id
  LOOP
    UPDATE public.order_items oi
       SET paid_unit_price = ROUND(v_item.unit_price * v_exchange_rate, 2),
           paid_subtotal   = ROUND(v_item.subtotal   * v_exchange_rate, 2)
     WHERE oi.id = v_item.id;
  END LOOP;

  RETURN QUERY
    SELECT o.id, o.order_number
      FROM public.orders o
     WHERE o.id = p_order_id;
END;
$$;

COMMENT ON FUNCTION public.submit_order_payment(UUID, UUID, UUID, TEXT, DATE, TEXT, TEXT) IS
  'Registra el reporte de pago: congela moneda y tasa, guarda issuer_bank para métodos VES.';
