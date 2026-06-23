-- @type hook
-- @hook auth.custom_access_token_hook
-- Inyecta `is_admin` en app_metadata del JWT en cada token emitido.
-- Registrar en: Supabase Dashboard → Authentication → Hooks → Custom Access Token.

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event JSONB)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_user_id  UUID;
  v_claims   JSONB;
BEGIN
  v_user_id := (event->>'user_id')::UUID;

  SELECT p.is_admin
    INTO v_is_admin
    FROM public.profiles p
   WHERE p.id = v_user_id;

  IF NOT FOUND THEN
    v_is_admin := FALSE;
  END IF;

  v_claims := event->'claims';

  IF jsonb_typeof(v_claims->'app_metadata') IS NULL THEN
    v_claims := jsonb_set(v_claims, '{app_metadata}', '{}'::jsonb);
  END IF;

  v_claims := jsonb_set(
    v_claims,
    '{app_metadata, is_admin}',
    to_jsonb(COALESCE(v_is_admin, FALSE))
  );

  RETURN jsonb_set(event, '{claims}', v_claims);
END;
$$;

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;

GRANT EXECUTE
  ON FUNCTION public.custom_access_token_hook(JSONB)
  TO supabase_auth_admin;

REVOKE EXECUTE
  ON FUNCTION public.custom_access_token_hook(JSONB)
  FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE public.profiles TO supabase_auth_admin;

DROP POLICY IF EXISTS "Allow auth admin to read profiles" ON public.profiles;

CREATE POLICY "Allow auth admin to read profiles"
  ON public.profiles
  AS PERMISSIVE
  FOR SELECT
  TO supabase_auth_admin
  USING (true);
