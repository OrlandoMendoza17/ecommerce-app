# 🔐 Guía de Implementación de Administradores

## 📋 Resumen

Esta implementación te permite tener **administradores separados de clientes** usando:
- ✅ Misma tabla `auth.users` (Supabase Auth)
- ✅ Tabla `admin_roles` para definir quién es admin
- ✅ RLS para proteger operaciones administrativas
- ✅ Funciones helper para verificar permisos fácilmente

## 🚀 Instalación

### Paso 1: Ejecutar Scripts SQL

Ejecuta los archivos en este orden:

```bash
1. admin_roles.sql              # Crea la tabla de roles y funciones
2. update_rls_for_admins.sql    # Agrega policies de RLS para admins
3. seed_admin.sql               # Crea tu primer super admin
```

### Paso 2: Crear tu Primer Usuario

1. **Regístrate** en tu app usando Supabase Auth (email/password)
2. Ve a **Supabase Dashboard** → Authentication → Users
3. Copia el **UUID** de tu usuario
4. Edita `seed_admin.sql` y reemplaza `'TU-USER-ID-AQUI'` con tu UUID
5. Ejecuta el script

```sql
-- Ejemplo:
INSERT INTO admin_roles (profile_id, role, ...)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::UUID, -- Tu UUID aquí
  'super_admin',
  ...
);
```

## 🎭 Tipos de Roles

### 1. **Super Admin** (Dueño de la Tienda)
```sql
role: 'super_admin'
```
- ✅ Acceso total
- ✅ Puede crear/eliminar otros admins
- ✅ Puede gestionar usuarios
- ✅ Puede ver todo el analytics

### 2. **Admin** (Gestor de Tienda)
```sql
role: 'admin'
```
- ✅ Puede gestionar productos y categorías
- ✅ Puede gestionar órdenes
- ✅ Puede moderar reseñas
- ✅ Puede ver analytics
- ❌ NO puede gestionar otros admins
- ❌ NO puede gestionar usuarios

### 3. **Moderator** (Moderador de Contenido)
```sql
role: 'moderator'
```
- ✅ Puede aprobar/rechazar reseñas
- ✅ Puede ver productos y órdenes (solo lectura)
- ❌ NO puede modificar productos
- ❌ NO puede modificar órdenes
- ❌ NO puede ver analytics completo

## 🔧 Funciones Helper

### Verificar si es Admin

```sql
-- En SQL
SELECT is_admin();
-- Retorna: true/false
```

```typescript
// En tu app (TypeScript)
const { data, error } = await supabase
  .rpc('is_admin');

if (data) {
  console.log('Usuario es admin');
}
```

### Verificar si es Super Admin

```sql
-- En SQL
SELECT is_super_admin();
```

```typescript
// En tu app
const { data } = await supabase.rpc('is_super_admin');
```

### Verificar Permiso Específico

```sql
-- En SQL
SELECT has_admin_permission('products');
SELECT has_admin_permission('orders');
SELECT has_admin_permission('users');
```

```typescript
// En tu app
const { data: canManageProducts } = await supabase
  .rpc('has_admin_permission', { permission: 'products' });

if (canManageProducts) {
  // Mostrar panel de gestión de productos
}
```

### Obtener Rol Completo

```sql
-- En SQL
SELECT * FROM get_user_admin_role();
```

```typescript
// En tu app
const { data: adminRole } = await supabase
  .rpc('get_user_admin_role');

console.log(adminRole);
/*
{
  role: 'super_admin',
  can_manage_products: true,
  can_manage_categories: true,
  can_manage_orders: true,
  can_manage_users: true,
  can_view_analytics: true,
  can_moderate_reviews: true
}
*/
```

## 💻 Implementación en el Frontend

### 1. Verificar si Usuario es Admin

```typescript
// hooks/useAdmin.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  async function checkAdminStatus() {
    try {
      const { data, error } = await supabase.rpc('is_admin');
      if (!error) {
        setIsAdmin(data);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return { isAdmin, isLoading };
}
```

### 2. Hook para Permisos Específicos

```typescript
// hooks/useAdminPermissions.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Permission = 'products' | 'categories' | 'orders' | 'users' | 'analytics' | 'reviews';

export function useAdminPermission(permission: Permission) {
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkPermission();
  }, [permission]);

  async function checkPermission() {
    try {
      const { data, error } = await supabase
        .rpc('has_admin_permission', { permission });
      
      if (!error) {
        setHasPermission(data);
      }
    } catch (error) {
      console.error('Error checking permission:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return { hasPermission, isLoading };
}
```

### 3. Componente Protegido

```tsx
// components/AdminRoute.tsx
import { useAdmin } from '@/hooks/useAdmin';
import { Navigate } from 'react-router-dom';

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading } = useAdmin();

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
```

### 4. Uso en Rutas

```tsx
// App.tsx
import { AdminRoute } from '@/components/AdminRoute';

function App() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/" element={<Home />} />
      <Route path="/products" element={<Products />} />
      
      {/* Rutas de admin protegidas */}
      <Route path="/admin" element={
        <AdminRoute>
          <AdminDashboard />
        </AdminRoute>
      } />
      
      <Route path="/admin/products" element={
        <AdminRoute>
          <AdminProducts />
        </AdminRoute>
      } />
    </Routes>
  );
}
```

### 5. Botón Condicional (Solo para Admins)

```tsx
// components/ProductCard.tsx
import { useAdmin } from '@/hooks/useAdmin';

export function ProductCard({ product }) {
  const { isAdmin } = useAdmin();

  return (
    <div className="product-card">
      <img src={product.image} />
      <h3>{product.name}</h3>
      <p>${product.price}</p>
      
      {/* Solo admins ven el botón de editar */}
      {isAdmin && (
        <button onClick={() => editProduct(product.id)}>
          ✏️ Editar Producto
        </button>
      )}
    </div>
  );
}
```

### 6. Panel de Admin Completo

```tsx
// pages/AdminDashboard.tsx
import { useAdminPermission } from '@/hooks/useAdminPermissions';

export function AdminDashboard() {
  const { hasPermission: canManageProducts } = useAdminPermission('products');
  const { hasPermission: canManageOrders } = useAdminPermission('orders');
  const { hasPermission: canViewAnalytics } = useAdminPermission('analytics');

  return (
    <div className="admin-dashboard">
      <h1>Panel de Administración</h1>
      
      <div className="admin-grid">
        {canManageProducts && (
          <AdminCard 
            title="Productos" 
            link="/admin/products"
            icon="📦"
          />
        )}
        
        {canManageOrders && (
          <AdminCard 
            title="Órdenes" 
            link="/admin/orders"
            icon="📋"
          />
        )}
        
        {canViewAnalytics && (
          <AdminCard 
            title="Analytics" 
            link="/admin/analytics"
            icon="📊"
          />
        )}
      </div>
    </div>
  );
}
```

## 🔒 Operaciones CRUD para Admins

### Crear Producto (Solo Admins)

```typescript
async function createProduct(productData) {
  // RLS verificará automáticamente que el usuario sea admin
  const { data, error } = await supabase
    .from('products')
    .insert(productData)
    .select()
    .single();

  if (error) {
    if (error.code === '42501') {
      console.error('No tienes permisos de admin');
    }
  }

  return { data, error };
}
```

### Actualizar Estado de Orden (Solo Admins)

```typescript
async function updateOrderStatus(orderId: string, newStatus: string) {
  // RLS verificará que sea admin con permiso de orders
  const { data, error } = await supabase
    .from('orders')
    .update({ 
      status: newStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .select()
    .single();

  return { data, error };
}
```

### Aprobar Reseña (Solo Admins/Moderadores)

```typescript
async function approveReview(reviewId: string) {
  // RLS verificará permiso de reviews
  const { data, error } = await supabase
    .from('reviews')
    .update({ is_approved: true })
    .eq('id', reviewId)
    .select()
    .single();

  return { data, error };
}
```

## 🎨 UI/UX Recomendaciones

### 1. Separar Navegación

```tsx
// Layout.tsx
export function Layout() {
  const { isAdmin } = useAdmin();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div>
      {isAdminRoute ? (
        <AdminNavbar />  // Navbar para admin
      ) : (
        <CustomerNavbar />  // Navbar para clientes
      )}
      
      <main>{children}</main>
    </div>
  );
}
```

### 2. Badge de Admin

```tsx
// components/UserMenu.tsx
export function UserMenu() {
  const { user } = useUser();
  const { isAdmin } = useAdmin();

  return (
    <div className="user-menu">
      <img src={user.avatar} />
      <span>{user.name}</span>
      
      {isAdmin && (
        <span className="badge badge-admin">
          👑 Admin
        </span>
      )}
    </div>
  );
}
```

### 3. Dashboard Diferenciado

```
/               → Homepage (clientes)
/products       → Catálogo (clientes)
/cart           → Carrito (clientes)
/account        → Mi cuenta (clientes)

/admin          → Dashboard admin ⚠️
/admin/products → Gestión productos ⚠️
/admin/orders   → Gestión órdenes ⚠️
/admin/analytics → Reportes ⚠️
```

## 🛡️ Seguridad - Mejores Prácticas

### ✅ DO (Hacer):

1. **Siempre usar RLS** - Nunca confíes solo en el frontend
2. **Verificar permisos en el backend** - Usa las funciones helper
3. **Logs de auditoría** - Registra acciones administrativas
4. **Principio de menor privilegio** - Da solo los permisos necesarios
5. **Revisar periódicamente** - Audita quién tiene acceso de admin

### ❌ DON'T (No hacer):

1. **No hardcodear verificaciones** - Usa las funciones RLS
2. **No dar super_admin a todos** - Solo al dueño
3. **No exponer rutas admin sin verificación** - Usa `<AdminRoute>`
4. **No confiar en localStorage** - Verifica permisos en cada request
5. **No permitir auto-promoción** - Solo super_admins crean admins

## 📊 Consultas Útiles

### Ver todos los administradores

```sql
SELECT 
  p.email,
  p.full_name,
  ar.role,
  ar.created_at
FROM admin_roles ar
JOIN profiles p ON p.id = ar.profile_id
ORDER BY ar.role, ar.created_at;
```

### Ver acciones de un admin específico

```sql
-- Ejemplo: Ver órdenes actualizadas por un admin
SELECT 
  o.order_number,
  o.status,
  o.updated_at,
  p.email as updated_by
FROM orders o
JOIN profiles p ON p.id = o.updated_by  -- Necesitarías agregar este campo
WHERE p.id IN (SELECT profile_id FROM admin_roles);
```

## 🚨 Eliminar Acceso de Admin

```sql
-- Eliminar rol de admin de un usuario
DELETE FROM admin_roles
WHERE profile_id = 'uuid-del-usuario';

-- El usuario vuelve a ser un cliente normal automáticamente
```

## 📚 Próximos Pasos Recomendados

1. **Logs de Auditoría**: Crear tabla `admin_activity_logs`
2. **Notificaciones**: Email cuando se crea nuevo admin
3. **Sesiones**: Timeout más corto para sesiones de admin
4. **2FA**: Autenticación de dos factores para super_admins
5. **IP Whitelist**: Opcional, solo permitir admin desde IPs específicas

---

**¿Dudas?** Revisa los archivos SQL comentados o consulta la documentación de Supabase RLS.

