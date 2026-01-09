-- ============================================
-- TABLA: admin_roles
-- Descripción: Define qué usuarios tienen rol de administrador
-- ============================================

CREATE TYPE admin_role_type AS ENUM (
  'super_admin',  -- Acceso total (dueño de la tienda)
  'admin',        -- Gestión de productos, órdenes, etc.
  'moderator'     -- Solo aprobar reseñas y gestionar contenido
);

CREATE TABLE IF NOT EXISTS public.admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role admin_role_type NOT NULL DEFAULT 'admin',
  
  -- Permisos específicos (opcional, para granularidad fina)
  can_manage_products BOOLEAN DEFAULT TRUE,
  can_manage_categories BOOLEAN DEFAULT TRUE,
  can_manage_orders BOOLEAN DEFAULT TRUE,
  can_manage_users BOOLEAN DEFAULT FALSE, -- Solo super_admin
  can_view_analytics BOOLEAN DEFAULT TRUE,
  can_moderate_reviews BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id), -- Quién le dio el rol
  
  -- Un usuario solo puede tener un rol de admin
  UNIQUE(profile_id)
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_admin_roles_profile_id ON public.admin_roles(profile_id);
CREATE INDEX IF NOT EXISTS idx_admin_roles_role ON public.admin_roles(role);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- Solo super_admins pueden ver la lista de admins
CREATE POLICY "Super admins can view all admin roles"
  ON public.admin_roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_roles ar
      WHERE ar.profile_id = auth.uid()
        AND ar.role = 'super_admin'
    )
  );

-- Los usuarios pueden ver su propio rol de admin (si lo tienen)
CREATE POLICY "Users can view own admin role"
  ON public.admin_roles
  FOR SELECT
  USING (profile_id = auth.uid());

-- Solo super_admins pueden crear nuevos admins
CREATE POLICY "Super admins can create admin roles"
  ON public.admin_roles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_roles ar
      WHERE ar.profile_id = auth.uid()
        AND ar.role = 'super_admin'
    )
  );

-- Solo super_admins pueden actualizar roles
CREATE POLICY "Super admins can update admin roles"
  ON public.admin_roles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_roles ar
      WHERE ar.profile_id = auth.uid()
        AND ar.role = 'super_admin'
    )
  );

-- Solo super_admins pueden eliminar roles (excepto su propio rol)
CREATE POLICY "Super admins can delete admin roles"
  ON public.admin_roles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_roles ar
      WHERE ar.profile_id = auth.uid()
        AND ar.role = 'super_admin'
    )
    AND profile_id != auth.uid() -- No puede eliminarse a sí mismo
  );

-- ============================================
-- TRIGGER PARA UPDATED_AT
-- ============================================

CREATE TRIGGER update_admin_roles_updated_at
  BEFORE UPDATE ON public.admin_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCIONES HELPER PARA VERIFICAR PERMISOS
-- ============================================

-- Verificar si el usuario actual es admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE profile_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar si el usuario actual es super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE profile_id = auth.uid()
      AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar permiso específico
CREATE OR REPLACE FUNCTION has_admin_permission(permission TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE profile_id = auth.uid()
      AND CASE permission
        WHEN 'products' THEN can_manage_products
        WHEN 'categories' THEN can_manage_categories
        WHEN 'orders' THEN can_manage_orders
        WHEN 'users' THEN can_manage_users
        WHEN 'analytics' THEN can_view_analytics
        WHEN 'reviews' THEN can_moderate_reviews
        ELSE FALSE
      END = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Obtener rol del usuario actual
CREATE OR REPLACE FUNCTION get_user_admin_role()
RETURNS TABLE (
  role admin_role_type,
  can_manage_products BOOLEAN,
  can_manage_categories BOOLEAN,
  can_manage_orders BOOLEAN,
  can_manage_users BOOLEAN,
  can_view_analytics BOOLEAN,
  can_moderate_reviews BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ar.role,
    ar.can_manage_products,
    ar.can_manage_categories,
    ar.can_manage_orders,
    ar.can_manage_users,
    ar.can_view_analytics,
    ar.can_moderate_reviews
  FROM public.admin_roles ar
  WHERE ar.profile_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON TABLE admin_roles IS 'Define qué usuarios tienen permisos de administrador en la tienda';
COMMENT ON COLUMN admin_roles.role IS 'Nivel de acceso: super_admin (dueño), admin (gestión completa), moderator (solo contenido)';
COMMENT ON FUNCTION is_admin() IS 'Retorna TRUE si el usuario actual tiene cualquier rol de admin';
COMMENT ON FUNCTION is_super_admin() IS 'Retorna TRUE si el usuario actual es super_admin';
COMMENT ON FUNCTION has_admin_permission(TEXT) IS 'Verifica si el usuario tiene un permiso específico (products, categories, orders, users, analytics, reviews)';

