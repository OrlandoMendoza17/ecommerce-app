# 🏪 E-commerce Database - Supabase

Base de datos completa para e-commerce de impresiones en madera con cortadora láser.

## 📁 Estructura del Proyecto

```
supabase/
├── docs/                          # 📚 Toda la documentación
│   ├── README.md                  # Documentación principal de la BD
│   ├── admin_functions_guide.md   # Guía de funciones SQL de admin
│   ├── admin_implementation_guide.md  # Implementación completa de admins
│   └── product_stats_README.md    # Explicación de product_stats
│
├── tables/                        # 🗄️ Definiciones de tablas
│   ├── profiles.sql
│   ├── addresses.sql
│   ├── categories.sql
│   ├── products.sql
│   ├── cart.sql
│   ├── cart_items.sql
│   ├── orders.sql
│   ├── order_items.sql
│   ├── reviews.sql
│   ├── product_stats.sql
│   └── admin_roles.sql
│
└── scripts/                       # 🔧 Scripts de inicialización
    └── seed_admin.sql             # Crear primer super admin
```

## 🚀 Inicio Rápido

> 📖 **Guía detallada paso a paso**: Ver [`docs/setup_database_guide.md`](docs/setup_database_guide.md)

### 1. Ejecutar Scripts SQL

Ejecuta los archivos en `tables/` en orden:

```bash
cd tables/

# 1. Estructura base
psql -f profiles.sql
psql -f addresses.sql

# 2. Productos
psql -f categories.sql
psql -f products.sql

# 3. Carritos
psql -f cart.sql
psql -f cart_items.sql

# 4. Órdenes
psql -f orders.sql
psql -f order_items.sql

# 5. Reseñas y estadísticas
psql -f reviews.sql
psql -f product_stats.sql

# 6. Administradores
psql -f admin_roles.sql

# 7. Crear primer admin (edita el UUID primero)
cd ../scripts/
psql -f seed_admin.sql
```

### 2. Crear tu Primer Admin

1. Edita `tables/seed_admin.sql`
2. Reemplaza `'TU-USER-ID-AQUI'` con tu UUID de Supabase
3. Ejecuta el script

## 📚 Documentación

### 🚀 Guía de Setup (¡EMPIEZA AQUÍ!)

**[`docs/setup_database_guide.md`](docs/setup_database_guide.md)** - Guía paso a paso para crear la BD

- ✅ Orden exacto de ejecución de archivos SQL
- ✅ Explicación de dependencias
- ✅ Scripts de verificación
- ✅ Solución de problemas comunes
- ✅ Tips para SQL Editor de Supabase

### 📖 Documentación Principal

**[`docs/README.md`](docs/README.md)** - Documentación completa de la base de datos

- Todas las tablas explicadas
- Relaciones y diagramas
- RLS policies
- Triggers y funciones
- Mejores prácticas

### 🔐 Sistema de Administradores

**[`docs/admin_implementation_guide.md`](docs/admin_implementation_guide.md)** - Implementación completa

- Instalación paso a paso
- Tipos de roles (super_admin, admin, moderator)
- Ejemplos de código React/TypeScript
- Hooks personalizados
- Componentes protegidos

**[`docs/admin_functions_guide.md`](docs/admin_functions_guide.md)** - Funciones SQL de admin

- `is_admin()` - Verificar si es admin
- `is_super_admin()` - Verificar si es super admin
- `has_admin_permission()` - Verificar permisos específicos
- `get_user_admin_role()` - Obtener rol completo
- Ejemplos de uso en RLS y frontend

### 📊 Estadísticas de Productos

**[`docs/product_stats_README.md`](docs/product_stats_README.md)** - Tabla de estadísticas

- Qué es y por qué es importante
- Cómo funciona
- Casos de uso reales
- Queries útiles

## 🗂️ Tablas Principales

| Tabla           | Descripción                       | Archivo                    |
| --------------- | --------------------------------- | -------------------------- |
| `profiles`      | Perfiles de usuario               | `tables/profiles.sql`      |
| `addresses`     | Direcciones de envío              | `tables/addresses.sql`     |
| `categories`    | Categorías de productos           | `tables/categories.sql`    |
| `products`      | Productos (con imágenes en JSONB) | `tables/products.sql`      |
| `cart`          | Carritos de compra                | `tables/cart.sql`          |
| `cart_items`    | Items del carrito                 | `tables/cart_items.sql`    |
| `orders`        | Órdenes de compra                 | `tables/orders.sql`        |
| `order_items`   | Items de órdenes                  | `tables/order_items.sql`   |
| `reviews`       | Reseñas de productos              | `tables/reviews.sql`       |
| `product_stats` | Estadísticas agregadas            | `tables/product_stats.sql` |
| `admin_roles`   | Roles de administrador            | `tables/admin_roles.sql`   |

## ✨ Características

### 🔒 Seguridad

- ✅ Row Level Security (RLS) en todas las tablas
- ✅ Políticas granulares por rol
- ✅ Funciones con `SECURITY DEFINER`
- ✅ Soft delete en profiles

### 👥 Sistema de Usuarios

- ✅ Perfiles extendidos de Supabase Auth
- ✅ Múltiples direcciones por usuario
- ✅ Separación de clientes y administradores
- ✅ Sistema de roles con permisos granulares

### 📦 Gestión de Productos

- ✅ Categorías jerárquicas
- ✅ Especificaciones técnicas para láser
- ✅ Galería de imágenes
- ✅ Control de inventario
- ✅ Soporte para personalización
- ✅ SEO friendly

### 🛒 Carrito y Compras

- ✅ Carritos persistentes
- ✅ Soporte para usuarios anónimos
- ✅ Precios guardados al agregar
- ✅ Personalización de productos

### 📋 Órdenes

- ✅ Estados de orden automáticos
- ✅ Números de orden auto-generados
- ✅ Tracking de envío
- ✅ Histórico preservado (datos desnormalizados)

### ⭐ Reseñas

- ✅ Verificación de compra
- ✅ Sistema de moderación
- ✅ Rating de 1-5 estrellas
- ✅ Una reseña por producto por usuario

### 📊 Analytics

- ✅ Estadísticas pre-calculadas
- ✅ Actualización automática con triggers
- ✅ Queries optimizados para reportes

## 🔧 Funciones Helper

```typescript
// Verificar si usuario es admin
const { data } = await supabase.rpc("is_admin");

// Verificar permiso específico
const { data } = await supabase.rpc("has_admin_permission", {
  permission: "products",
});

// Obtener todos los permisos
const { data } = await supabase.rpc("get_user_admin_role");
```

## 📝 Próximos Pasos

1. ✅ Ejecuta todos los scripts SQL en orden
2. ✅ Crea tu primer super admin
3. 📖 Lee la documentación en `docs/`
4. 💻 Implementa en tu frontend siguiendo las guías
5. 🎨 Conecta Supabase Storage para imágenes
6. 💳 Integra un gateway de pagos
7. 📧 Configura notificaciones por email

## 🆘 Ayuda

- **Documentación completa**: `docs/README.md`
- **Guía de admins**: `docs/admin_implementation_guide.md`
- **Funciones SQL**: `docs/admin_functions_guide.md`
- **Product Stats**: `docs/product_stats_README.md`

---

**Creado con ❤️ para e-commerce de impresiones en madera con cortadora láser** 🪵⚡
