-- @type standalone
-- @entity orders
-- Guarda el modo de entrega del pedido (address | coordinate) y copia los datos de dirección.
-- Auth + address: copia desde `addresses` por p_address_id.
-- Guest + address: escribe campos inline en shipping_* (no usa la tabla addresses).

-- Drop old signatures if they still exist in the database
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
           -- Use guest fields when no profile, otherwise use profile data
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
