-- =============================================================================
-- MIGRACIÓN: columnas de pago en moneda local (Opción A — columnas paralelas)
-- Ejecutar en Supabase → SQL Editor si la BD ya existe.
--
-- ADVERTENCIA: limpia las tablas order_items y orders porque las columnas
-- nuevas son NOT NULL y PostgreSQL no permite añadirlas a filas existentes
-- sin un valor por defecto explícito previo (en este caso sí hay DEFAULT,
-- pero por coherencia y para evitar datos huérfanos se vacían primero).
-- =============================================================================

-- 1. Vaciar tablas dependientes primero (FK order_items → orders)
TRUNCATE TABLE public.order_items CASCADE;
TRUNCATE TABLE public.orders CASCADE;

-- 2. Nuevas columnas en orders (NOT NULL con defaults)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_currency      VARCHAR(3)    NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS payment_exchange_rate DECIMAL(15,4) NOT NULL DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS paid_total            DECIMAL(15,2) NOT NULL DEFAULT 0;

-- 3. Nuevas columnas en order_items (NOT NULL con defaults)
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS paid_unit_price DECIMAL(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paid_subtotal   DECIMAL(15,2) NOT NULL DEFAULT 0;

-- 4. Reemplazar submit_order_payment (captura moneda y tasa al reportar pago)
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
  v_customer_notes  TEXT;
  v_currency        VARCHAR(3);
  v_exchange_rate   DECIMAL(15,4);
  v_paid_total      DECIMAL(15,2);
  v_item            RECORD;
BEGIN
  SELECT o.id, o.profile_id, o.status, o.customer_notes, o.total
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

  v_customer_notes := CASE
    WHEN v_order.customer_notes IS NOT NULL AND trim(v_order.customer_notes) <> ''
      THEN trim(v_order.customer_notes) || E'\nBanco emisor: ' || p_issuer_bank
    ELSE
      'Banco emisor: ' || p_issuer_bank
  END;

  UPDATE public.orders o
     SET status                = 'payment_submitted',
         payment_status        = 'submitted',
         payment_method_id     = p_payment_method_id,
         payment_reference     = trim(p_payment_reference),
         payment_proof_url     = COALESCE(NULLIF(trim(p_payment_proof_url), ''), o.payment_proof_url),
         customer_notes        = v_customer_notes,
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
  'Registra el reporte de pago: congela moneda y tasa, calcula paid_total/paid_unit_price/paid_subtotal.';
