-- @type standalone
-- @entity orders
-- El cliente reporta su pago. No descuenta stock ni confirma el pedido.
-- Captura la moneda del método de pago y congela la tasa vigente.

CREATE OR REPLACE FUNCTION public.submit_order_payment(
  p_order_id          UUID,
  p_user_id           UUID DEFAULT NULL,
  p_payment_method_id UUID DEFAULT NULL,
  p_payment_reference TEXT DEFAULT '',
  p_payment_date      DATE DEFAULT NULL,
  p_issuer_bank       TEXT DEFAULT '',
  p_payment_proof_url TEXT DEFAULT '',
  p_guest_token       UUID DEFAULT NULL
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
  -- ── 1. Validar orden ─────────────────────────────────────────────────────
  SELECT o.id, o.profile_id, o.guest_access_token, o.status, o.total
    INTO v_order
    FROM public.orders o
   WHERE o.id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido no encontrado: %', p_order_id
      USING ERRCODE = 'P0001';
  END IF;

  -- Access check: authenticated user OR guest token
  IF v_order.profile_id IS NOT NULL THEN
    IF p_user_id IS NULL OR v_order.profile_id <> p_user_id THEN
      RAISE EXCEPTION 'No tienes acceso a este pedido'
        USING ERRCODE = 'P0002';
    END IF;
  ELSE
    IF p_guest_token IS NULL OR v_order.guest_access_token <> p_guest_token THEN
      RAISE EXCEPTION 'No tienes acceso a este pedido'
        USING ERRCODE = 'P0002';
    END IF;
  END IF;

  IF v_order.status <> 'pending_payment' THEN
    RAISE EXCEPTION 'Este pedido ya no acepta datos de pago (estado: %)', v_order.status
      USING ERRCODE = 'P0003';
  END IF;

  -- ── 2. Validar método de pago y derivar moneda ────────────────────────────
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

  -- ── 3. Banco emisor (solo métodos VES) ────────────────────────────────────
  IF v_currency = 'VES' THEN
    v_issuer_bank := trim(COALESCE(p_issuer_bank, ''));
    IF v_issuer_bank = '' THEN
      RAISE EXCEPTION 'El banco emisor es obligatorio para este método de pago'
        USING ERRCODE = 'P0007';
    END IF;
  ELSE
    v_issuer_bank := '';
  END IF;

  -- ── 4. Obtener tasa de cambio vigente ──────────────────────────────────────
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

  -- ── 5. Calcular paid_total ────────────────────────────────────────────────
  v_paid_total := ROUND(v_order.total * v_exchange_rate, 2);

  -- ── 6. UPDATE orders ──────────────────────────────────────────────────────
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

  -- ── 7. UPDATE order_items con precios en moneda de pago ───────────────────
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

COMMENT ON FUNCTION public.submit_order_payment(UUID, UUID, UUID, TEXT, DATE, TEXT, TEXT, UUID) IS
  'Registra el reporte de pago: congela moneda y tasa, guarda issuer_bank para métodos VES. Soporta acceso via user_id o guest_token.';
