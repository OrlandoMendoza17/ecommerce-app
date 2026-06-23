-- @type standalone
-- @entity orders
-- Guarda el modo de entrega del pedido (address | coordinate) y copia los datos de dirección.

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

  IF p_mode NOT IN ('address', 'coordinate') THEN
    RAISE EXCEPTION 'Modo de entrega no válido: %', p_mode
      USING ERRCODE = 'P0005';
  END IF;

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
  'Guarda el modo de entrega (address | coordinate) y copia los campos shipping_* al pedido.';
