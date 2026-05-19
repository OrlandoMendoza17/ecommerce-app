-- Políticas RLS de profiles que dependen de public.is_admin()
-- Ejecutar después de functions/standalone/profiles/is_admin.sql

CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can update profiles"
  ON public.profiles
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());
