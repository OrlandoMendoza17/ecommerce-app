# 🔧 Guía de Funciones SQL de Administrador

## 📋 Índice

1. [Introducción](#introducción)
2. [Funciones Disponibles](#funciones-disponibles)
3. [Detalles Técnicos](#detalles-técnicos)
4. [Ejemplos de Uso](#ejemplos-de-uso)
5. [Casos de Uso Avanzados](#casos-de-uso-avanzados)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Introducción

Las funciones SQL de administrador son **funciones helper** que facilitan la verificación de permisos en:

- **RLS Policies**: Para proteger tablas automáticamente
- **Frontend**: Para mostrar/ocultar UI según permisos
- **Backend**: Para validaciones adicionales

### ¿Por qué usar funciones?

**❌ Sin funciones** (repetitivo y difícil de mantener):

```sql
CREATE POLICY "..." ON products FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_roles
    WHERE profile_id = auth.uid()
      AND can_manage_products = TRUE
  )
);
```

**✅ Con funciones** (limpio y reutilizable):

```sql
CREATE POLICY "..." ON products FOR INSERT
WITH CHECK (has_admin_permission('products'));
```

---

## 📚 Funciones Disponibles

### 1. `is_admin()` - ¿Es Administrador?

**Definición:**

```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_roles
    WHERE profile_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Descripción:**

- Verifica si el usuario actual tiene **cualquier rol** de administrador
- No importa si es `super_admin`, `admin` o `moderator`
- Retorna `TRUE` si tiene rol, `FALSE` si es cliente normal

**Uso en RLS:**

```sql
CREATE POLICY "Admins can view all products"
  ON products
  FOR SELECT
  USING (is_admin());
```

**Uso en Frontend:**

```typescript
const { data: isAdmin } = await supabase.rpc("is_admin");

if (isAdmin) {
  // Mostrar panel de administración
}
```

**Cuándo usar:**

- Para dar acceso general a admins (ver datos, acceder a rutas admin)
- Cuando no importa el tipo específico de admin
- Para rutas generales como `/admin/dashboard`

---

### 2. `is_super_admin()` - ¿Es Super Administrador?

**Definición:**

```sql
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_roles
    WHERE profile_id = auth.uid()
      AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Descripción:**

- Verifica si el usuario es específicamente un **super_admin** (dueño)
- Más restrictivo que `is_admin()`
- Solo `super_admin` puede pasar esta verificación

**Uso en RLS:**

```sql
CREATE POLICY "Super admins can create admin roles"
  ON admin_roles
  FOR INSERT
  WITH CHECK (is_super_admin());
```

**Uso en Frontend:**

```typescript
const { data: isSuperAdmin } = await supabase.rpc("is_super_admin");

if (isSuperAdmin) {
  // Mostrar opciones de gestión de usuarios y admins
}
```

**Cuándo usar:**

- Para operaciones críticas (crear/eliminar admins)
- Gestión de usuarios del sistema
- Configuraciones globales de la tienda
- Analytics sensibles (costos, ganancias reales)

---

### 3. `has_admin_permission(permission TEXT)` - ¿Tiene Permiso Específico?

**Definición:**

```sql
CREATE OR REPLACE FUNCTION has_admin_permission(permission TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_roles
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
```

**Descripción:**

- Verifica si el admin tiene un **permiso específico**
- Recibe el nombre del permiso como string
- Mapea el string a la columna correspondiente en `admin_roles`

**Permisos disponibles:**

| String         | Columna verificada      | Permite                               |
| -------------- | ----------------------- | ------------------------------------- |
| `'products'`   | `can_manage_products`   | Crear/editar/eliminar productos       |
| `'categories'` | `can_manage_categories` | Gestionar categorías                  |
| `'orders'`     | `can_manage_orders`     | Ver/actualizar órdenes                |
| `'users'`      | `can_manage_users`      | Gestionar usuarios (solo super_admin) |
| `'analytics'`  | `can_view_analytics`    | Ver reportes y estadísticas           |
| `'reviews'`    | `can_moderate_reviews`  | Aprobar/rechazar reseñas              |

**Uso en RLS:**

```sql
CREATE POLICY "Admins can update products"
  ON products
  FOR UPDATE
  USING (has_admin_permission('products'))
  WITH CHECK (has_admin_permission('products'));
```

**Uso en Frontend:**

```typescript
// Verificar permiso específico
const { data: canManageProducts } = await supabase.rpc("has_admin_permission", {
  permission: "products",
});

if (canManageProducts) {
  // Mostrar botones de editar/eliminar productos
}

// Verificar múltiples permisos
const checkPermissions = async () => {
  const [products, orders, reviews] = await Promise.all([
    supabase.rpc("has_admin_permission", { permission: "products" }),
    supabase.rpc("has_admin_permission", { permission: "orders" }),
    supabase.rpc("has_admin_permission", { permission: "reviews" }),
  ]);

  return {
    canManageProducts: products.data,
    canManageOrders: orders.data,
    canModerateReviews: reviews.data,
  };
};
```

**Cuándo usar:**

- Para control granular de operaciones
- Cuando diferentes admins tienen diferentes responsabilidades
- Para mostrar/ocultar secciones específicas del panel admin

---

### 4. `get_user_admin_role()` - Obtener Rol Completo

**Definición:**

```sql
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
  FROM admin_roles ar
  WHERE ar.profile_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Descripción:**

- Retorna **todos los datos del rol** del usuario actual
- Incluye el tipo de rol y todos los permisos
- Retorna vacío si el usuario no es admin

**Uso en Frontend:**

```typescript
const { data: adminRole } = await supabase.rpc("get_user_admin_role");

if (adminRole && adminRole.length > 0) {
  const role = adminRole[0];

  console.log("Rol:", role.role); // 'super_admin', 'admin', 'moderator'
  console.log("Permisos:", {
    products: role.can_manage_products,
    categories: role.can_manage_categories,
    orders: role.can_manage_orders,
    users: role.can_manage_users,
    analytics: role.can_view_analytics,
    reviews: role.can_moderate_reviews,
  });
}
```

**Cuándo usar:**

- Al cargar el panel de administración (obtener todos los permisos de una vez)
- Para mostrar el badge de rol del usuario
- Para renderizar el menú de navegación basado en permisos
- Para cachear permisos en el estado global de la app

**Ejemplo de hook personalizado:**

```typescript
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useAdminRole() {
  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAdminRole();
  }, []);

  async function loadAdminRole() {
    try {
      const { data, error } = await supabase.rpc("get_user_admin_role");

      if (!error && data && data.length > 0) {
        const adminData = data[0];
        setRole(adminData.role);
        setPermissions({
          products: adminData.can_manage_products,
          categories: adminData.can_manage_categories,
          orders: adminData.can_manage_orders,
          users: adminData.can_manage_users,
          analytics: adminData.can_view_analytics,
          reviews: adminData.can_moderate_reviews,
        });
      }
    } catch (error) {
      console.error("Error loading admin role:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return { role, permissions, isLoading };
}
```

---

## 🔍 Detalles Técnicos

### `SECURITY DEFINER` - ¿Qué es?

Todas las funciones tienen la cláusula `SECURITY DEFINER`:

```sql
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**¿Qué significa?**

- La función se ejecuta con los **permisos del creador** (tu admin de Supabase)
- NO con los permisos del usuario que la invoca
- Similar a `sudo` en Linux

**¿Por qué es necesario?**

Sin `SECURITY DEFINER`:

```
Usuario cliente → Llama is_admin()
                ↓
                Intenta leer admin_roles
                ↓
                ❌ Error: No tiene permisos para leer admin_roles
```

Con `SECURITY DEFINER`:

```
Usuario cliente → Llama is_admin()
                ↓
                Función se ejecuta como admin de Supabase
                ↓
                ✅ Lee admin_roles exitosamente
                ↓
                Retorna TRUE/FALSE
```

**⚠️ Seguridad:**
`SECURITY DEFINER` es seguro aquí porque:

- Las funciones solo leen datos (no modifican)
- Solo verifican el usuario actual (`auth.uid()`)
- No permiten especificar qué usuario verificar
- Están bien definidas y limitadas en alcance

---

### `auth.uid()` - Usuario Actual

Todas las funciones usan `auth.uid()`:

```sql
WHERE profile_id = auth.uid()
```

**¿Qué es `auth.uid()`?**

- Función de Supabase que retorna el **UUID del usuario autenticado**
- Retorna el ID del usuario que hizo el request
- Retorna `NULL` si no hay usuario autenticado

**Flujo:**

```
1. Usuario hace login → Supabase crea sesión JWT
2. Usuario hace request → JWT incluye user_id
3. auth.uid() → Extrae user_id del JWT
4. Función verifica → Usa ese user_id para buscar en admin_roles
```

**Seguridad:**

- Imposible falsificar `auth.uid()`
- El valor viene del JWT firmado por Supabase
- Los usuarios solo pueden verificar sus propios permisos

---

### Tipos de Retorno

| Función                      | Tipo de Retorno | Valores Posibles                   |
| ---------------------------- | --------------- | ---------------------------------- |
| `is_admin()`                 | `BOOLEAN`       | `TRUE`, `FALSE`                    |
| `is_super_admin()`           | `BOOLEAN`       | `TRUE`, `FALSE`                    |
| `has_admin_permission(TEXT)` | `BOOLEAN`       | `TRUE`, `FALSE`                    |
| `get_user_admin_role()`      | `TABLE`         | Fila con todos los campos, o vacío |

---

## 💡 Ejemplos de Uso

### Ejemplo 1: Proteger Operación CRUD

```sql
-- Solo admins con permiso pueden crear productos
CREATE POLICY "Admins can insert products"
  ON products
  FOR INSERT
  WITH CHECK (has_admin_permission('products'));

-- Solo admins con permiso pueden actualizar productos
CREATE POLICY "Admins can update products"
  ON products
  FOR UPDATE
  USING (has_admin_permission('products'))
  WITH CHECK (has_admin_permission('products'));
```

### Ejemplo 2: Diferentes Niveles de Acceso

```sql
-- Todos los admins pueden VER órdenes
CREATE POLICY "Admins can view all orders"
  ON orders
  FOR SELECT
  USING (is_admin());

-- Solo admins con permiso pueden ACTUALIZAR órdenes
CREATE POLICY "Admins can update orders"
  ON orders
  FOR UPDATE
  USING (has_admin_permission('orders'))
  WITH CHECK (has_admin_permission('orders'));

-- Solo super admins pueden ELIMINAR órdenes
CREATE POLICY "Super admins can delete orders"
  ON orders
  FOR DELETE
  USING (is_super_admin());
```

### Ejemplo 3: Panel de Admin con Permisos

```typescript
// AdminLayout.tsx
import { useAdminRole } from "@/hooks/useAdminRole";

export function AdminLayout({ children }) {
  const { role, permissions, isLoading } = useAdminRole();

  if (isLoading) return <Spinner />;
  if (!role) return <Navigate to="/" />;

  return (
    <div className="admin-layout">
      <Sidebar>
        {/* Siempre visible para todos los admins */}
        <SidebarItem to="/admin/dashboard" icon="📊">
          Dashboard
        </SidebarItem>

        {/* Solo si tiene permiso de productos */}
        {permissions?.products && (
          <SidebarItem to="/admin/products" icon="📦">
            Productos
          </SidebarItem>
        )}

        {/* Solo si tiene permiso de órdenes */}
        {permissions?.orders && (
          <SidebarItem to="/admin/orders" icon="📋">
            Órdenes
          </SidebarItem>
        )}

        {/* Solo si tiene permiso de reseñas */}
        {permissions?.reviews && (
          <SidebarItem to="/admin/reviews" icon="⭐">
            Reseñas
          </SidebarItem>
        )}

        {/* Solo super admin */}
        {role === "super_admin" && (
          <SidebarItem to="/admin/users" icon="👥">
            Usuarios y Admins
          </SidebarItem>
        )}
      </Sidebar>

      <main>{children}</main>
    </div>
  );
}
```

### Ejemplo 4: Verificación en Acción

```typescript
// Crear producto
async function createProduct(productData) {
  // Primero verificar si tiene permiso (opcional, para UX)
  const { data: hasPermission } = await supabase.rpc("has_admin_permission", {
    permission: "products",
  });

  if (!hasPermission) {
    toast.error("No tienes permiso para crear productos");
    return;
  }

  // RLS verificará automáticamente de nuevo en el backend
  const { data, error } = await supabase
    .from("products")
    .insert(productData)
    .select()
    .single();

  if (error) {
    if (error.code === "42501") {
      toast.error("Permiso denegado");
    } else {
      toast.error("Error al crear producto");
    }
  } else {
    toast.success("Producto creado exitosamente");
  }

  return { data, error };
}
```

---

## 🚀 Casos de Uso Avanzados

### 1. Combinar Múltiples Verificaciones

```sql
-- Pueden ver productos inactivos:
-- - Todos los clientes ven productos activos
-- - Admins ven todos los productos
CREATE POLICY "View products based on role"
  ON products
  FOR SELECT
  USING (
    is_active = TRUE  -- Clientes ven activos
    OR
    is_admin()        -- Admins ven todos
  );
```

### 2. Auditoría de Acciones

```sql
-- Tabla de logs
CREATE TABLE admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para loggear actualizaciones de productos
CREATE OR REPLACE FUNCTION log_product_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF is_admin() THEN
    INSERT INTO admin_activity_logs (
      admin_id,
      action,
      table_name,
      record_id
    ) VALUES (
      auth.uid(),
      TG_OP,
      'products',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER log_product_updates
  AFTER UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION log_product_changes();
```

### 3. Permisos Dinámicos en Queries

```typescript
// Obtener productos con opciones de edición solo si tiene permiso
async function getProductsWithActions() {
  const { data: canEdit } = await supabase.rpc("has_admin_permission", {
    permission: "products",
  });

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  return products.map((product) => ({
    ...product,
    canEdit,
    canDelete: canEdit,
  }));
}
```

---

## 🐛 Troubleshooting

### Problema 1: La función retorna `FALSE` pero debería retornar `TRUE`

**Posibles causas:**

```sql
-- Verificar si el usuario tiene rol de admin
SELECT * FROM admin_roles WHERE profile_id = auth.uid();

-- Si retorna vacío, el usuario no tiene rol
-- Solución: Agregar el usuario a admin_roles
INSERT INTO admin_roles (profile_id, role, ...)
VALUES (auth.uid(), 'admin', ...);
```

### Problema 2: Error "permission denied for function"

**Causa:** Las funciones no tienen `SECURITY DEFINER`

**Solución:** Recrear las funciones con `SECURITY DEFINER`:

```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
...
$$ LANGUAGE plpgsql SECURITY DEFINER;  -- ← Importante
```

### Problema 3: `has_admin_permission()` siempre retorna `FALSE`

**Verificar:**

```sql
-- 1. Usuario tiene rol?
SELECT * FROM admin_roles WHERE profile_id = auth.uid();

-- 2. El permiso específico está en TRUE?
SELECT can_manage_products FROM admin_roles
WHERE profile_id = auth.uid();

-- 3. Estás pasando el string correcto?
SELECT has_admin_permission('products');  -- ✅ Correcto
SELECT has_admin_permission('product');   -- ❌ Typo
```

### Problema 4: No puedo llamar la función desde el frontend

**Verificar:**

```typescript
// Sintaxis correcta
const { data, error } = await supabase.rpc("is_admin");

// Para funciones con parámetros
const { data, error } = await supabase.rpc(
  "has_admin_permission",
  { permission: "products" } // Parámetros como objeto
);

// Verificar errores
if (error) {
  console.error("Error:", error.message);
}
```

---

## 📚 Recursos Adicionales

- **Archivo de definición**: `tables/admin_roles.sql`
- **Guía de implementación**: `docs/admin_implementation_guide.md`
- **Actualización de RLS**: `tables/update_rls_for_admins.sql`
- **Documentación de Supabase**: [Database Functions](https://supabase.com/docs/guides/database/functions)

---

## 🎯 Resumen Rápido

```typescript
// ¿Es admin de cualquier tipo?
await supabase.rpc('is_admin')
→ TRUE/FALSE

// ¿Es super admin?
await supabase.rpc('is_super_admin')
→ TRUE/FALSE

// ¿Tiene permiso específico?
await supabase.rpc('has_admin_permission', { permission: 'products' })
→ TRUE/FALSE

// ¿Cuáles son todos sus permisos?
await supabase.rpc('get_user_admin_role')
→ { role, can_manage_products, can_manage_orders, ... }
```

**Recuerda:** Estas funciones son la base del sistema de permisos. Úsalas en RLS policies, frontend y validaciones para mantener tu tienda segura! 🔒
