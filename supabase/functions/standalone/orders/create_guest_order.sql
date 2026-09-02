-- @type standalone
-- @entity orders
-- Crea un pedido guest (sin sesión) directamente desde items proporcionados.
-- Valida stock, reserva cantidades y genera un guest_access_token para acceso posterior.

CREATE OR REPLACE FUNCTION public.create_guest_order(
  p_guest_name   TEXT,
  p_guest_email  TEXT,
  p_guest_phone  TEXT,
  p_order_number TEXT,
  p_items        JSONB
)
RETURNS TABLE (id UUID, order_number TEXT, guest_access_token UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_order_id     UUID;
  v_token        UUID := gen_random_uuid();
  v_items        JSONB;
  v_item         RECORD;
  v_subtotal     DECIMAL(10,2) := 0;
  v_rows_updated INTEGER;
  v_parsed       RECORD;
BEGIN
  -- Accept array JSONB or a JSON string scalar (legacy callers)
  v_items := CASE
    WHEN jsonb_typeof(p_items) = 'string' THEN (p_items #>> '{}')::jsonb
    ELSE p_items
  END;

  IF v_items IS NULL OR jsonb_typeof(v_items) <> 'array' OR jsonb_array_length(v_items) = 0 THEN
    RAISE EXCEPTION 'Debes enviar al menos un producto'
      USING ERRCODE = 'P0001';
  END IF;

  IF COALESCE(TRIM(p_guest_email), '') = '' THEN
    RAISE EXCEPTION 'El email es obligatorio'
      USING ERRCODE = 'P0001';
  END IF;

  -- Validate stock and reserve for each item
  FOR v_parsed IN
    SELECT
      (elem->>'product_id')::UUID   AS product_id,
      (elem->>'variant_id')::UUID   AS variant_id,
      (elem->>'quantity')::INTEGER  AS quantity,
      COALESCE(elem->>'customization_text', '') AS customization_text,
      COALESCE(elem->>'customization_notes', '') AS customization_notes
    FROM jsonb_array_elements(v_items) AS elem
  LOOP
    SELECT
      pr.name AS product_name,
      pr.is_active AS product_active,
      pv.is_active AS variant_active,
      pv.allow_backorder,
      pv.stock_quantity,
      pv.reserved_quantity
    INTO v_item
    FROM public.products pr
    JOIN public.product_variants pv ON pv.id = v_parsed.variant_id
    WHERE pr.id = v_parsed.product_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Producto o variante no encontrado'
        USING ERRCODE = 'P0003';
    END IF;

    IF NOT v_item.product_active OR NOT v_item.variant_active THEN
      RAISE EXCEPTION 'Uno o más productos ya no están disponibles'
        USING ERRCODE = 'P0003';
    END IF;

    IF NOT v_item.allow_backorder
       AND (v_item.stock_quantity - v_item.reserved_quantity) < v_parsed.quantity THEN
      RAISE EXCEPTION 'Stock insuficiente para "%" (disponible: %, solicitado: %)',
        v_item.product_name,
        GREATEST(0, v_item.stock_quantity - v_item.reserved_quantity),
        v_parsed.quantity
        USING ERRCODE = 'P0004';
    END IF;

    UPDATE public.product_variants pv
       SET reserved_quantity = pv.reserved_quantity + v_parsed.quantity,
           updated_at = NOW()
     WHERE pv.id = v_parsed.variant_id
       AND (
         pv.allow_backorder = TRUE
         OR (pv.stock_quantity - pv.reserved_quantity) >= v_parsed.quantity
       );

    GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
    IF v_rows_updated = 0 THEN
      RAISE EXCEPTION 'No se pudo reservar stock para "%"', v_item.product_name
        USING ERRCODE = 'P0004';
    END IF;
  END LOOP;

  -- Create the order
  INSERT INTO public.orders (
    profile_id,
    guest_name,
    guest_email,
    guest_phone,
    guest_access_token,
    order_number,
    status,
    payment_status,
    subtotal, tax, shipping_cost, discount, total,
    shipping_delivery_mode,
    shipping_full_name,
    shipping_phone,
    shipping_address_line1, shipping_address_line2,
    shipping_city, shipping_state, shipping_postal_code, shipping_country
  ) VALUES (
    NULL,
    COALESCE(TRIM(p_guest_name), ''),
    TRIM(p_guest_email),
    COALESCE(TRIM(p_guest_phone), ''),
    v_token,
    p_order_number,
    'pending_payment',
    'pending',
    0, 0, 0, 0, 0,
    'coordinate',
    COALESCE(TRIM(p_guest_name), ''),
    COALESCE(TRIM(p_guest_phone), ''),
    '', '', '', '', '', ''
  )
  RETURNING public.orders.id INTO v_order_id;

  -- Create order items
  FOR v_parsed IN
    SELECT
      (elem->>'product_id')::UUID   AS product_id,
      (elem->>'variant_id')::UUID   AS variant_id,
      (elem->>'quantity')::INTEGER  AS quantity,
      COALESCE(elem->>'customization_text', '') AS customization_text,
      COALESCE(elem->>'customization_notes', '') AS customization_notes
    FROM jsonb_array_elements(v_items) AS elem
  LOOP
    INSERT INTO public.order_items (
      order_id, product_id, variant_id, quantity,
      customization_text, customization_notes,
      unit_price, subtotal
    ) VALUES (
      v_order_id,
      v_parsed.product_id,
      v_parsed.variant_id,
      v_parsed.quantity,
      v_parsed.customization_text,
      v_parsed.customization_notes,
      0, 0
    );
  END LOOP;

  -- Calculate subtotals
  UPDATE public.order_items oi
     SET subtotal = oi.quantity * oi.unit_price
   WHERE oi.order_id = v_order_id;

  SELECT COALESCE(SUM(oi.subtotal), 0)
    INTO v_subtotal
    FROM public.order_items oi
   WHERE oi.order_id = v_order_id;

  UPDATE public.orders o
     SET subtotal = v_subtotal,
         total = v_subtotal,
         updated_at = NOW()
   WHERE o.id = v_order_id;

  RETURN QUERY
    SELECT v_order_id, p_order_number, v_token;
END;
$$;

COMMENT ON FUNCTION public.create_guest_order(TEXT, TEXT, TEXT, TEXT, JSONB) IS
  'Crea pedido guest sin sesion. Valida stock, reserva cantidades, genera guest_access_token.';
