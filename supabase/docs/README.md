# Base de Datos E-commerce - Impresiones en Madera

## 🚀 ¿Primera vez aquí?

**Empieza con la guía de setup**: [`setup_database_guide.md`](setup_database_guide.md)

Esta guía te muestra el orden exacto para ejecutar los archivos SQL en Supabase.

---

## 📋 Estructura de la Base de Datos

Esta base de datos está diseñada para una aplicación de e-commerce especializada en impresiones en madera hechas con cortadora láser.

## 📁 Estructura del Proyecto

```
supabase/
├── docs/                          # 📚 Documentación
│   ├── README.md                  # Este archivo (documentación completa)
│   ├── setup_database_guide.md    # Guía de setup y orden de ejecución
│   └── product_stats_README.md    # Explicación de product_stats
│   └── product_options_guide.md   # Sistema de opciones configurables de productos
│
├── tables/                        # 🗄️ Definiciones de tablas
│   ├── profiles.sql               # Tabla de perfiles
│   ├── addresses.sql              # Direcciones de envío
│   ├── categories.sql             # Categorías de productos
│   ├── products.sql               # Productos (con imágenes en JSONB)
│   ├── cart.sql                   # Carritos de compra
│   ├── cart_items.sql             # Items del carrito
│   ├── payment_methods.sql        # Métodos de pago disponibles
│   ├── orders.sql                 # Órdenes de compra
│   ├── order_items.sql            # Items de órdenes
│   ├── reviews.sql                # Reseñas de productos
│   └── product_stats.sql          # Estadísticas de productos
│
└── scripts/                       # 🔧 Scripts de inicialización
    ├── seed_admin.sql             # Promover usuario a administrador
    └── seed_payment_methods.sql   # Insertar métodos de pago
```

## 🗂️ Entidades y Relaciones

### 1. **profiles** (`tables/profiles.sql`)

Tabla de perfiles de usuario que extiende la funcionalidad de `auth.users` de Supabase.

- Campos: email, full_name, phone, avatar_url, date_of_birth, **`is_admin`**
- **Cliente** (`is_admin = FALSE`) vs **administrador** (`is_admin = TRUE`, acceso al dashboard)
- Función `is_admin()` para RLS y frontend
- **Soft delete**: Campo `deleted_at` para eliminación lógica
- Se crea automáticamente cuando se registra un usuario
- RLS: Los usuarios solo pueden ver/editar su propio perfil; admins ven todos los perfiles

### 2. **addresses** (`tables/addresses.sql`)

Direcciones de envío de los usuarios.

- Múltiples direcciones por usuario
- Soporte para dirección predeterminada (is_default)
- Trigger que asegura solo una dirección default por usuario
- RLS: Los usuarios solo pueden gestionar sus propias direcciones
- Referencia: `profile_id` → `profiles(id)`

### 3. **categories** (`tables/categories.sql`)

Categorías de productos con soporte para jerarquías (parent_id).

- Slug único para URLs amigables
- Control de orden de visualización
- RLS: Todos pueden ver categorías activas

### 4. **products** (`tables/products.sql`)

Productos (impresiones en madera) con especificaciones técnicas.

- Información detallada: material, peso
- **Opciones configurables** (ver [`product_options_guide.md`](product_options_guide.md)):
  - `dimension_options`: Array de opciones de dimensiones (ej: ['90cm', '90x40cm'])
  - `thickness_options`: Array de opciones de grosor (ej: ['5.5mm', '3mm'])
  - Cada producto tiene sus propias opciones independientes
- Control de inventario (stock_quantity)
- Soporte para personalización
- **Precios**:
  - `price`: Precio de venta al cliente
  - `compare_at_price`: Precio "antes" para mostrar descuentos
  - `cost`: Costo de producción (privado, para análisis de rentabilidad)
- **Inventario**:
  - `sku`: Código único del producto
  - `stock_quantity`: Cantidad disponible
  - `low_stock_threshold`: Umbral de alerta
  - `allow_backorder`: Si se puede comprar bajo pedido cuando no hay stock
- **Imágenes**:
  - `images`: Array JSONB de URLs de imágenes (ej: `["url1.jpg", "url2.jpg"]`)
  - Fácil de gestionar con componentes frontend existentes
- SEO friendly (meta_title, meta_description)
- RLS: Todos pueden ver productos activos

### 5. **cart** (`tables/cart.sql`)

Carritos de compra.

- Soporte para usuarios autenticados (profile_id) y anónimos (session_id)
- Un carrito por usuario/sesión
- RLS: Los usuarios solo pueden ver su propio carrito
- Referencia: `profile_id` → `profiles(id)`

### 6. **cart_items** (`tables/cart_items.sql`)

Items individuales en el carrito.

- Cantidad y precio unitario
- **Opciones seleccionadas**: `selected_dimension` y `selected_thickness`
- Soporte para personalización
- Trigger que establece el precio automáticamente
- Constraint: Un producto con las mismas opciones solo una vez por carrito
- RLS: Los usuarios solo pueden gestionar items de su carrito

### 7. **payment_methods** (`tables/payment_methods.sql`)

Métodos de pago disponibles (configurables por el admin).

- **Información del método**: nombre, código único, descripción
- **Datos de pago**: JSONB flexible (ej: datos bancarios, teléfono para pago móvil, etc.)
- **Configuración**:
  - `requires_reference`: Si requiere número de referencia/transacción
  - `requires_proof`: Si requiere captura del comprobante
  - `instructions`: Instrucciones paso a paso para el cliente
- Control de visualización con `display_order`
- RLS: Todos pueden ver métodos activos, solo admins pueden gestionar
- **Casos de uso**: Transferencia bancaria, pago móvil, Zelle, efectivo, etc.

### 8. **orders** (`tables/orders.sql`)

Órdenes de compra.

- Estados: pending, payment_confirmed, processing, shipped, delivered, cancelled, refunded
- Número de orden auto-generado (formato: YY000001)
- Información de envío desnormalizada (mantiene histórico)
- Totales: subtotal, tax, shipping_cost, discount, total
- **Información de pago**:
  - `payment_method_id`: Referencia al método de pago seleccionado
  - `payment_reference`: Número de referencia/transacción del pago
  - `payment_proof_url`: URL de la captura del comprobante (Supabase Storage)
  - `payment_status`: Estado del pago (pending, confirmed, failed)
- Tracking de envío
- Triggers automáticos para timestamps de estado
- RLS: Los usuarios solo pueden ver sus propias órdenes
- Referencias: `profile_id` → `profiles(id)`, `payment_method_id` → `payment_methods(id)`

### 9. **order_items** (`tables/order_items.sql`)

Items de cada orden.

- Información del producto desnormalizada (histórico)
- **Opciones seleccionadas guardadas**: `selected_dimension` y `selected_thickness`
- Personalización incluida
- Trigger para calcular subtotal automáticamente
- RLS: Los usuarios solo pueden ver items de sus órdenes

### 10. **reviews** (`tables/reviews.sql`)

Reseñas y calificaciones de productos.

- Rating de 1 a 5 estrellas
- Sistema de moderación (is_approved)
- Verificación de compra (is_verified_purchase)
- Constraint: Una reseña por producto por usuario
- RLS: Solo usuarios que compraron pueden reseñar
- Todos pueden ver reseñas aprobadas
- Referencia: `profile_id` → `profiles(id)`

### 11. **product_stats** (`tables/product_stats.sql`)

Estadísticas agregadas de productos (cache de performance).

- **Total de ventas y revenue**: Calculado desde orders/order_items
- **Promedio de calificaciones**: Calculado desde reviews aprobadas
- **Total de reseñas**: Contador de reviews
- Se actualiza automáticamente con triggers cuando:
  - Se crea/actualiza/elimina un order_item
  - Se crea/actualiza/elimina una review
- **Ventajas**:
  - Evita queries costosas de agregación en tiempo real
  - Permite ordenar productos por popularidad/rating de forma eficiente
  - Útil para reportes y dashboard de analytics
- RLS: Lectura pública

## 🔐 Row Level Security (RLS)

Todas las tablas tienen RLS habilitado con políticas específicas:

- **Usuarios**: Solo pueden ver/editar sus propios datos
- **Productos/Categorías**: Lectura pública, escritura solo admin
- **Carritos/Órdenes**: Completamente privados por usuario
- **Reseñas**: Lectura pública (aprobadas), escritura con validación de compra

## 📊 Índices

Índices estratégicos en:

- Claves foráneas para joins rápidos
- Campos de búsqueda frecuente (slug, email, order_number)
- Filtros comunes (is_active, status)
- Ordenamiento (created_at, price, rating)
- Índices compuestos para queries complejas

## 🔄 Triggers Automáticos

- **updated_at**: Se actualiza automáticamente en cada UPDATE
- **Creación de perfil**: Al registrar usuario en auth.users
- **Número de orden**: Generación automática secuencial
- **Dirección default**: Solo una por usuario
- **Precios del carrito**: Se copian del producto
- **Estadísticas**: Se actualizan al crear órdenes/reseñas
- **Timestamps de orden**: Se actualizan según cambios de estado

## 🚀 Orden de Ejecución

Ejecutar los archivos SQL en este orden (respetando dependencias):

```bash
# Ejecutar desde el directorio supabase/tables/

# 1. Estructura base
tables/profiles.sql
tables/addresses.sql

# 2. Productos y categorías
tables/categories.sql
tables/products.sql

# 3. Carritos
tables/cart.sql
tables/cart_items.sql

# 4. Pagos y órdenes
tables/payment_methods.sql
tables/orders.sql
tables/order_items.sql

# 5. Reseñas y estadísticas
tables/reviews.sql
tables/product_stats.sql

# 6. Primer administrador
scripts/seed_admin.sql  # ⚠️ Editar con tu UUID primero
```

## 💡 Características Especiales

### Gestión de Inventario

- `stock_quantity`: Cantidad disponible en inventario
- `low_stock_threshold`: Umbral de alerta cuando el stock está bajo
- `allow_backorder`: Permite comprar bajo pedido cuando no hay stock disponible

### Carritos Persistentes

- Usuarios autenticados: Por profile_id
- Usuarios anónimos: Por session_id
- Conversión de carrito anónimo a usuario al login (implementar en app)

### Histórico de Datos

Las órdenes guardan información desnormalizada:

- Dirección de envío completa
- Detalles de productos (nombre, SKU, precio)
  Esto preserva la información aunque se modifique el producto original.

### Soft Delete en Profiles

El campo `deleted_at` permite eliminar usuarios de forma lógica sin perder el histórico de órdenes.

## 📈 Tabla product_stats - Explicación Detallada

### ¿Para qué sirve?

Es una **tabla de cache** que almacena estadísticas pre-calculadas de productos para optimizar el rendimiento.

**Sin product_stats**, cada vez que quieras mostrar:

- "Productos más vendidos" → Query costoso sumando todas las order_items
- "Productos mejor valorados" → Query costoso promediando todas las reviews
- "Productos populares" → Multiple joins y agregaciones

**Con product_stats**:

- Un simple `SELECT * FROM product_stats ORDER BY total_sales DESC` → Instantáneo ⚡
- Las estadísticas se mantienen actualizadas automáticamente con triggers

### Casos de uso:

1. **Homepage** - "Top 10 productos más vendidos"
2. **Filtros** - "Ordenar por: Más vendidos | Mejor valorados"
3. **Dashboard Admin** - Reportes de productos sin queries pesados
4. **Product Cards** - Mostrar "★★★★★ 4.8 (125 reviews)" sin calcular en tiempo real

### Cómo funciona:

```sql
-- Cuando se crea una orden, automáticamente actualiza:
INSERT INTO order_items (...)
-- ↓ Trigger automático
-- ↓ Actualiza product_stats con nuevos totales

-- Resultado en product_stats:
{
  product_id: "...",
  total_sales: 45,        // Se vendieron 45 unidades
  total_revenue: 2025000, // Generó $2,025,000 en ventas
  total_reviews: 12,      // Tiene 12 reseñas
  average_rating: 4.67    // Rating promedio 4.67/5
}
```

Es una optimización clásica de bases de datos: **sacrificar un poco de espacio de almacenamiento para ganar mucha velocidad en consultas**.

## 🔐 Clientes y administradores

- **Cliente**: `profiles.is_admin = FALSE` (valor por defecto).
- **Administrador**: `profiles.is_admin = TRUE` — acceso al dashboard (productos, órdenes, reseñas, etc.).
- **Función** `is_admin()` — usada en políticas RLS y desde el frontend (`supabase.rpc('is_admin')`).
- **Promover admin**: `scripts/seed_admin.sql` (ejecutar en SQL Editor con service role).
- Un trigger impide que un usuario se auto-asigne `is_admin` desde la app.

## 📝 Notas de Implementación

1. **Storage de Imágenes**: Usar Supabase Storage para guardar imágenes de productos y avatares
2. **Pagos**: Integrar con gateway (Stripe, MercadoPago, etc.)
3. **Sistema de Admin**: Flag `profiles.is_admin` + `is_admin()` (ver arriba)
4. **Notificaciones**: Implementar triggers de Supabase para enviar emails en cambios de estado
5. **Búsqueda**: Considerar implementar búsqueda full-text con pg_trgm o integraciones externas

## 🔧 Extensiones Recomendadas

```sql
-- Habilitar extensiones útiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para búsqueda fuzzy
```

## 📊 Cambios Importantes

- ✅ **user_id → profile_id**: Nomenclatura más clara y consistente en todas las tablas
- ✅ **deleted_at**: Soft delete en profiles para preservar histórico de órdenes
- ✅ **DEFAULT ''**: Todos los campos TEXT tienen string vacío por defecto
- ✅ **Comentarios detallados**: Campos de products completamente documentados
- ✅ **Clientes y admins**: Flag `is_admin` en `profiles`
- ✅ **RLS actualizado**: Policies para permitir acceso administrativo a todas las tablas
