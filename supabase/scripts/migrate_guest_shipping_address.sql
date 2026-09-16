-- =============================================================================
-- MIGRACIÓN: dirección de envío inline en checkout guest
-- =============================================================================
-- Ejecutar en Supabase → SQL Editor → Run.
--
-- Qué hace:
--   Reemplaza set_order_shipping: guest + address escribe shipping_* inline
--   (no usa la tabla addresses). Auth sigue copiando por p_address_id.
--   create_guest_order deja shipping_delivery_mode = 'pending' (como el
--   pedido autenticado) en lugar de 'coordinate'.
--   Coordinar como guest no lee un RECORD de perfil no asignado
--   (usa v_profile_name / v_profile_phone con default '').
--
-- Qué NO hace:
--   No cambia pedidos existentes. No persiste direcciones de guest.
--
-- Idempotente.
-- =============================================================================

DROP FUNCTION IF EXISTS public.set_order_shipping(UUID, UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS public.set_order_shipping(UUID, UUID, TEXT, UUID, UUID);
DROP FUNCTION IF EXISTS public.set_order_shipping(UUID, TEXT, UUID, UUID, UUID);

CREATE OR REPLACE FUNCTION public.set_order_shipping(
  p_order_id        UUID,
  p_mode            TEXT,                -- 'address' | 'coordinate'
  p_user_id         UUID    DEFAULT NULL,
  p_address_id      UUID    DEFAULT NULL,  -- requerido si auth + p_mode = 'address'
  p_guest_token     UUID    DEFAULT NULL,  -- requerido para pedidos guest
  p_full_name       TEXT    DEFAULT NULL,
  p_phone           TEXT    DEFAULT NULL,
  p_address_line1   TEXT    DEFAULT NULL,
  p_address_line2   TEXT    DEFAULT NULL,
  p_city            TEXT    DEFAULT NULL,
  p_state           TEXT    DEFAULT NULL,
  p_postal_code     TEXT    DEFAULT NULL,
  p_country         TEXT    DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_order         RECORD;
  v_address       RECORD;
  v_profile_name  TEXT := '';
  v_profile_phone TEXT := '';
BEGIN
  SELECT o.id, o.profile_id, o.guest_access_token,
         o.guest_name, o.guest_phone, o.status
    INTO v_order
    FROM public.orders o
   WHERE o.id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido no encontrado'
      USING ERRCODE = 'P0001';
  END IF;

  -- Access check: user or guest token
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
    RAISE EXCEPTION 'Solo se puede modificar la dirección de un pedido pendiente de pago'
      USING ERRCODE = 'P0003';
  END IF;

  IF p_mode NOT IN ('address', 'coordinate') THEN
    RAISE EXCEPTION 'Modo de entrega no válido: %', p_mode
      USING ERRCODE = 'P0005';
  END IF;

  -- Fetch profile contact info (only for authenticated orders)
  IF v_order.profile_id IS NOT NULL AND p_user_id IS NOT NULL THEN
    SELECT p.full_name, p.phone
      INTO v_profile_name, v_profile_phone
      FROM public.profiles p
     WHERE p.id = p_user_id;
  END IF;

  IF p_mode = 'address' THEN
    IF v_order.profile_id IS NULL THEN
      -- Guest: ignore p_address_id; snapshot inline fields onto the order
      IF COALESCE(trim(p_address_line1), '') = ''
         OR COALESCE(trim(p_city), '') = ''
         OR COALESCE(trim(p_state), '') = '' THEN
        RAISE EXCEPTION 'La dirección de envío está incompleta'
          USING ERRCODE = 'P0005';
      END IF;

      UPDATE public.orders
         SET shipping_delivery_mode  = 'address',
             shipping_full_name      = COALESCE(
               NULLIF(trim(COALESCE(p_full_name, '')), ''),
               NULLIF(trim(v_order.guest_name), ''),
               ''
             ),
             shipping_phone          = COALESCE(
               NULLIF(trim(COALESCE(p_phone, '')), ''),
               NULLIF(trim(v_order.guest_phone), ''),
               ''
             ),
             shipping_address_line1  = trim(p_address_line1),
             shipping_address_line2  = COALESCE(p_address_line2, ''),
             shipping_city           = trim(p_city),
             shipping_state          = trim(p_state),
             shipping_postal_code    = COALESCE(p_postal_code, ''),
             shipping_country        = COALESCE(NULLIF(trim(COALESCE(p_country, '')), ''), 'VE'),
             updated_at              = NOW()
       WHERE id = p_order_id;
    ELSE
      IF p_address_id IS NULL THEN
        RAISE EXCEPTION 'Debes seleccionar una dirección de envío'
          USING ERRCODE = 'P0005';
      END IF;

      SELECT
        a.full_name,
        a.phone,
        a.address_line1,
        a.address_line2,
        a.city,
        a.state,
        a.postal_code,
        a.country
        INTO v_address
        FROM public.addresses a
       WHERE a.id = p_address_id
         AND a.profile_id = p_user_id;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Dirección no encontrada o no pertenece a tu cuenta'
          USING ERRCODE = 'P0005';
      END IF;

      IF trim(v_address.address_line1) = ''
         OR trim(v_address.city) = ''
         OR trim(v_address.state) = '' THEN
        RAISE EXCEPTION 'La dirección seleccionada está incompleta. Actualízala en tu perfil.'
          USING ERRCODE = 'P0005';
      END IF;

      UPDATE public.orders
         SET shipping_delivery_mode  = 'address',
             shipping_full_name      = COALESCE(NULLIF(trim(v_address.full_name), ''), v_profile_name, ''),
             shipping_phone          = COALESCE(NULLIF(trim(v_address.phone), ''), v_profile_phone, ''),
             shipping_address_line1  = trim(v_address.address_line1),
             shipping_address_line2  = COALESCE(v_address.address_line2, ''),
             shipping_city           = trim(v_address.city),
             shipping_state          = trim(v_address.state),
             shipping_postal_code    = COALESCE(v_address.postal_code, ''),
             shipping_country        = COALESCE(NULLIF(trim(v_address.country), ''), 'VE'),
             updated_at              = NOW()
       WHERE id = p_order_id;
    END IF;

  ELSE -- 'coordinate'
    UPDATE public.orders
       SET shipping_delivery_mode  = 'coordinate',
           shipping_full_name      = COALESCE(
             NULLIF(TRIM(v_order.guest_name), ''),
             v_profile_name,
             ''
           ),
           shipping_phone          = COALESCE(
             NULLIF(TRIM(v_order.guest_phone), ''),
             v_profile_phone,
             ''
           ),
           shipping_address_line1  = '',
           shipping_address_line2  = '',
           shipping_city           = '',
           shipping_state          = '',
           shipping_postal_code    = '',
           shipping_country        = '',
           updated_at              = NOW()
     WHERE id = p_order_id;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.set_order_shipping(UUID, TEXT, UUID, UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) IS
  'Guarda el modo de entrega (address | coordinate) y copia los campos shipping_* al pedido. Auth copia desde addresses; guest escribe campos inline. Soporta acceso via user_id o guest_token.';

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
    'pending',
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
  'Crea pedido guest sin sesion. Valida stock, reserva cantidades, genera guest_access_token. shipping_delivery_mode = pending.';
