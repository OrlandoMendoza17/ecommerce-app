-- @type standalone
-- @entity profiles
-- Usada en políticas RLS de muchas tablas. Ejecutar antes de policies que llamen is_admin().

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND is_admin = TRUE
      AND deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_admin() IS
  'Retorna TRUE si el usuario actual es administrador (profiles.is_admin).';
