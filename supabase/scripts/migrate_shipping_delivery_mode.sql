-- =============================================================================
-- MIGRACIÓN: shipping_delivery_mode en orders
-- Ejecutar en Supabase → SQL Editor
-- =============================================================================

-- 1. Nueva columna (DEFAULT 'pending' para pedidos existentes)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_delivery_mode TEXT
    NOT NULL DEFAULT 'pending'
    CHECK (shipping_delivery_mode IN ('pending', 'address', 'coordinate'));

-- 2. Inferir modo en pedidos ya existentes:
--    · Si tiene address_line1 no vacío → 'address'
--    · De lo contrario → queda como 'pending'
UPDATE public.orders
   SET shipping_delivery_mode = 'address'
 WHERE trim(shipping_address_line1) <> '';

-- 3. Nuevo RPC: set_order_shipping
-- Copiado de:
--   supabase/functions/standalone/orders/set_order_shipping.sql

CREATE OR REPLACE FUNCTION public.set_order_shipping(
  p_order_id   UUID,
  p_user_id    UUID,
  p_mode       TEXT,                -- 'address' | 'coordinate'
  p_address_id UUID DEFAULT NULL    -- requerido si p_mode = 'address'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_order   RECORD;
  v_address RECORD;
  v_profile RECORD;
BEGIN
  -- Validar orden
  SELECT o.id, o.profile_id, o.status
    INTO v_order
    FROM public.orders o
   WHERE o.id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido no encontrado'
      USING ERRCODE = 'P0001';
  END IF;

  IF v_order.profile_id <> p_user_id THEN
    RAISE EXCEPTION 'No tienes acceso a este pedido'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_order.status <> 'pending_payment' THEN
    RAISE EXCEPTION 'Solo se puede modificar la dirección de un pedido pendiente de pago'
      USING ERRCODE = 'P0003';
  END IF;

  -- Validar modo
  IF p_mode NOT IN ('address', 'coordinate') THEN
    RAISE EXCEPTION 'Modo de entrega no válido: %', p_mode
      USING ERRCODE = 'P0005';
  END IF;

  -- Perfil del usuario
  SELECT p.full_name, p.phone
    INTO v_profile
    FROM public.profiles p
   WHERE p.id = p_user_id;

  IF p_mode = 'address' THEN
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
           shipping_full_name      = COALESCE(NULLIF(trim(v_address.full_name), ''), v_profile.full_name, ''),
           shipping_phone          = COALESCE(NULLIF(trim(v_address.phone), ''), v_profile.phone, ''),
           shipping_address_line1  = trim(v_address.address_line1),
           shipping_address_line2  = COALESCE(v_address.address_line2, ''),
           shipping_city           = trim(v_address.city),
           shipping_state          = trim(v_address.state),
           shipping_postal_code    = COALESCE(v_address.postal_code, ''),
           shipping_country        = COALESCE(NULLIF(trim(v_address.country), ''), 'VE'),
           updated_at              = NOW()
     WHERE id = p_order_id;

  ELSE -- 'coordinate'
    UPDATE public.orders
       SET shipping_delivery_mode  = 'coordinate',
           shipping_full_name      = COALESCE(v_profile.full_name, ''),
           shipping_phone          = COALESCE(v_profile.phone, ''),
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

COMMENT ON FUNCTION public.set_order_shipping(UUID, UUID, TEXT, UUID) IS
  'Guarda el modo de entrega del pedido (address o coordinate) y copia los datos de la dirección.';

-- 4. Actualizar create_order_from_cart: ya no requiere address_id, deja mode = pending
DROP FUNCTION IF EXISTS public.create_order_from_cart(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS public.create_order_from_cart(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.create_order_from_cart(
  p_user_id      UUID,
  p_order_number TEXT
)
RETURNS TABLE (id UUID, order_number TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_cart_id      UUID;
  v_order_id     UUID;
  v_item         RECORD;
  v_profile      RECORD;
  v_subtotal     DECIMAL(10,2) := 0;
  v_rows_updated INTEGER;
BEGIN
  SELECT c.id INTO v_cart_id
    FROM public.cart c
   WHERE c.profile_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tu carrito está vacío'
      USING ERRCODE = 'P0001';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.cart_items ci WHERE ci.cart_id = v_cart_id
  ) THEN
    RAISE EXCEPTION 'Tu carrito está vacío'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT p.full_name, p.phone
    INTO v_profile
    FROM public.profiles p
   WHERE p.id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil no encontrado'
      USING ERRCODE = 'P0002';
  END IF;

  FOR v_item IN
    SELECT
      ci.product_id,
      ci.variant_id,
      ci.quantity,
      ci.customization_text,
      ci.customization_notes,
      pr.name AS product_name,
      pr.is_active AS product_active,
      pv.is_active AS variant_active,
      pv.allow_backorder,
      pv.stock_quantity,
      pv.reserved_quantity
    FROM public.cart_items ci
    JOIN public.products pr ON pr.id = ci.product_id
    JOIN public.product_variants pv ON pv.id = ci.variant_id
   WHERE ci.cart_id = v_cart_id
  LOOP
    IF NOT v_item.product_active OR NOT v_item.variant_active THEN
      RAISE EXCEPTION 'Uno o más productos ya no están disponibles'
        USING ERRCODE = 'P0003';
    END IF;

    IF NOT v_item.allow_backorder
       AND (v_item.stock_quantity - v_item.reserved_quantity) < v_item.quantity THEN
      RAISE EXCEPTION 'Stock insuficiente para "%" (disponible: %, solicitado: %)',
        v_item.product_name,
        GREATEST(0, v_item.stock_quantity - v_item.reserved_quantity),
        v_item.quantity
        USING ERRCODE = 'P0004';
    END IF;

    UPDATE public.product_variants pv
       SET reserved_quantity = pv.reserved_quantity + v_item.quantity,
           updated_at = NOW()
     WHERE pv.id = v_item.variant_id
       AND (
         pv.allow_backorder = TRUE
         OR (pv.stock_quantity - pv.reserved_quantity) >= v_item.quantity
       );

    GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
    IF v_rows_updated = 0 THEN
      RAISE EXCEPTION 'No se pudo reservar stock para "%"', v_item.product_name
        USING ERRCODE = 'P0004';
    END IF;
  END LOOP;

  INSERT INTO public.orders (
    profile_id,
    order_number,
    status,
    payment_status,
    subtotal,
    tax,
    shipping_cost,
    discount,
    total,
    shipping_delivery_mode,
    shipping_full_name,
    shipping_phone,
    shipping_address_line1,
    shipping_address_line2,
    shipping_city,
    shipping_state,
    shipping_postal_code,
    shipping_country
  ) VALUES (
    p_user_id,
    p_order_number,
    'pending_payment',
    'pending',
    0, 0, 0, 0, 0,
    'pending',
    COALESCE(v_profile.full_name, ''),
    COALESCE(v_profile.phone, ''),
    '', '', '', '', '', ''
  )
  RETURNING public.orders.id INTO v_order_id;

  FOR v_item IN
    SELECT
      ci.product_id,
      ci.variant_id,
      ci.quantity,
      ci.customization_text,
      ci.customization_notes
    FROM public.cart_items ci
   WHERE ci.cart_id = v_cart_id
  LOOP
    INSERT INTO public.order_items (
      order_id,
      product_id,
      variant_id,
      quantity,
      customization_text,
      customization_notes,
      unit_price,
      subtotal
    ) VALUES (
      v_order_id,
      v_item.product_id,
      v_item.variant_id,
      v_item.quantity,
      v_item.customization_text,
      v_item.customization_notes,
      0,
      0
    );
  END LOOP;

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

  DELETE FROM public.cart_items ci WHERE ci.cart_id = v_cart_id;

  RETURN QUERY
    SELECT v_order_id, p_order_number;
END;
$$;

COMMENT ON FUNCTION public.create_order_from_cart(UUID, TEXT) IS
  'Crea pedido desde carrito con shipping_delivery_mode = pending. La dirección se define después en /pedido/:id/pago.';
