-- ============================================
-- SEED: Crear primer Super Admin
-- Descripción: Script para crear tu primer usuario administrador
-- ============================================

-- ⚠️ IMPORTANTE: Ejecuta este script DESPUÉS de crear tu primer usuario en Supabase Auth

-- Paso 1: Reemplaza 'TU-USER-ID-AQUI' con el UUID de tu usuario
-- Puedes obtenerlo desde:
-- 1. Supabase Dashboard → Authentication → Users
-- 2. O ejecutando: SELECT id, email FROM auth.users;

-- Paso 2: Ejecuta este script

-- Crear el primer super admin (CAMBIA EL UUID)
INSERT INTO admin_roles (
  profile_id,
  role,
  can_manage_products,
  can_manage_categories,
  can_manage_orders,
  can_manage_users,
  can_view_analytics,
  can_moderate_reviews
) VALUES (
  'TU-USER-ID-AQUI'::UUID, -- ⚠️ CAMBIA ESTO
  'super_admin',
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  TRUE
) ON CONFLICT (profile_id) DO NOTHING;

-- ============================================
-- EJEMPLOS: Crear otros tipos de administradores
-- ============================================

-- Ejemplo 1: Admin normal (gestión de productos y órdenes)
/*
INSERT INTO admin_roles (
  profile_id,
  role,
  can_manage_products,
  can_manage_categories,
  can_manage_orders,
  can_manage_users,
  can_view_analytics,
  can_moderate_reviews
) VALUES (
  'uuid-del-usuario'::UUID,
  'admin',
  TRUE,  -- Puede gestionar productos
  TRUE,  -- Puede gestionar categorías
  TRUE,  -- Puede gestionar órdenes
  FALSE, -- NO puede gestionar usuarios
  TRUE,  -- Puede ver analytics
  TRUE   -- Puede moderar reseñas
);
*/

-- Ejemplo 2: Moderador (solo aprobar reseñas y contenido)
/*
INSERT INTO admin_roles (
  profile_id,
  role,
  can_manage_products,
  can_manage_categories,
  can_manage_orders,
  can_manage_users,
  can_view_analytics,
  can_moderate_reviews
) VALUES (
  'uuid-del-usuario'::UUID,
  'moderator',
  FALSE, -- NO puede gestionar productos
  FALSE, -- NO puede gestionar categorías
  FALSE, -- NO puede gestionar órdenes
  FALSE, -- NO puede gestionar usuarios
  FALSE, -- NO puede ver analytics
  TRUE   -- Solo puede moderar reseñas
);
*/

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Ver todos los administradores creados
SELECT 
  p.email,
  p.full_name,
  ar.role,
  ar.can_manage_products,
  ar.can_manage_categories,
  ar.can_manage_orders,
  ar.can_manage_users,
  ar.created_at
FROM admin_roles ar
JOIN profiles p ON p.id = ar.profile_id
ORDER BY ar.created_at;

-- ============================================
-- FUNCIONES ÚTILES PARA TESTING
-- ============================================

-- Ver si tu usuario actual es admin
-- SELECT is_admin() as soy_admin;

-- Ver si tu usuario actual es super admin
-- SELECT is_super_admin() as soy_super_admin;

-- Ver tus permisos actuales
-- SELECT * FROM get_user_admin_role();

-- Verificar permiso específico
-- SELECT has_admin_permission('products') as puede_gestionar_productos;

