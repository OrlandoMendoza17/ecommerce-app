-- ============================================
-- SEED: Promover usuario a administrador
-- Descripción: Marca un perfil como admin (acceso al dashboard)
-- ============================================

-- ⚠️ IMPORTANTE:
-- 1. El usuario debe existir en Supabase Auth (y tener fila en profiles)
-- 2. Reemplaza 'TU-USER-ID-AQUI' con el UUID del usuario
-- 3. Ejecuta en SQL Editor (service role)

-- Obtener UUID: Dashboard → Authentication → Users
-- o: SELECT id, email FROM auth.users;

UPDATE public.profiles
SET
  is_admin = TRUE,
  updated_at = NOW()
WHERE id = 'TU-USER-ID-AQUI'::UUID;

-- ============================================
-- VERIFICACIÓN
-- ============================================

SELECT id, email, full_name, is_admin, created_at
FROM public.profiles
WHERE id = 'TU-USER-ID-AQUI'::UUID;

-- Con sesión iniciada como ese usuario:
-- SELECT is_admin() AS soy_admin;
