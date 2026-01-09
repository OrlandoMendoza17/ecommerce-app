# 🚀 Guía de Setup de Base de Datos en Supabase

## 📋 Orden de Ejecución de Archivos SQL

Esta guía te indica el orden correcto para ejecutar los archivos SQL en el **SQL Editor de Supabase** para crear la base de datos completa de tu e-commerce.

---

## ⚠️ IMPORTANTE: Antes de Empezar

1. **Accede a tu proyecto en Supabase**: [https://app.supabase.com](https://app.supabase.com)
2. Ve a **SQL Editor** en el menú lateral
3. Ten todos los archivos de la carpeta `tables/` listos para copiar/pegar
4. Ejecuta los scripts **uno por uno** en el orden indicado
5. Espera a que cada script termine antes de ejecutar el siguiente

---

## 📊 Orden de Ejecución (Respeta las Dependencias)

### **Paso 1: Tabla Base de Perfiles** ⭐ (CRÍTICO - Ejecutar Primero)

```sql
-- Archivo: tables/profiles.sql
```

**¿Por qué primero?**

- Crea la función `update_updated_at_column()` que usan TODAS las demás tablas
- Extiende `auth.users` de Supabase
- Es la base para todas las relaciones de usuarios
- Crea el trigger automático para nuevos usuarios

**Verificación:**

```sql
-- Debe retornar la tabla creada
SELECT * FROM public.profiles LIMIT 1;

-- Debe retornar la función
SELECT proname FROM pg_proc WHERE proname = 'update_updated_at_column';
```

---

### **Paso 2: Direcciones de Envío**

```sql
-- Archivo: tables/addresses.sql
```

**Dependencias:**

- ✅ `profiles` (FK: profile_id)

**Verificación:**

```sql
SELECT * FROM public.addresses LIMIT 1;
```

---

### **Paso 3: Categorías de Productos**

```sql
-- Archivo: tables/categories.sql
```

**Dependencias:**

- ✅ `categories` (FK: parent_id - auto-referencia, puede ser NULL)

**Verificación:**

```sql
SELECT * FROM public.categories LIMIT 1;
```

---

### **Paso 4: Productos** 📦

```sql
-- Archivo: tables/products.sql
```

**Dependencias:**

- ✅ `categories` (FK: category_id)

**Verificación:**

```sql
SELECT * FROM public.products LIMIT 1;
```

---

### **Paso 5: Carritos de Compra** 🛒

```sql
-- Archivo: tables/cart.sql
```

**Dependencias:**

- ✅ `profiles` (FK: profile_id)

**Verificación:**

```sql
SELECT * FROM public.cart LIMIT 1;
```

---

### **Paso 6: Items del Carrito**

```sql
-- Archivo: tables/cart_items.sql
```

**Dependencias:**

- ✅ `cart` (FK: cart_id)
- ✅ `products` (FK: product_id)

**Verificación:**

```sql
SELECT * FROM public.cart_items LIMIT 1;
```

---

### **Paso 7: Métodos de Pago** 💳

```sql
-- Archivo: tables/payment_methods.sql
```

**Dependencias:**

- Ninguna (tabla independiente)

**Verificación:**

```sql
SELECT * FROM public.payment_methods LIMIT 1;
```

---

### **Paso 8: Órdenes de Compra** 📋

```sql
-- Archivo: tables/orders.sql
```

**Dependencias:**

- ✅ `profiles` (FK: profile_id)
- ✅ `payment_methods` (FK: payment_method_id)

**Nota:** Este archivo crea el tipo ENUM `order_status`

**Verificación:**

```sql
SELECT * FROM public.orders LIMIT 1;

-- Verificar ENUM
SELECT typname, enumlabel
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typname = 'order_status';
```

---

### **Paso 9: Items de Órdenes**

```sql
-- Archivo: tables/order_items.sql
```

**Dependencias:**

- ✅ `orders` (FK: order_id)
- ✅ `products` (FK: product_id)

**Verificación:**

```sql
SELECT * FROM public.order_items LIMIT 1;
```

---

### **Paso 10: Reseñas de Productos** ⭐

```sql
-- Archivo: tables/reviews.sql
```

**Dependencias:**

- ✅ `profiles` (FK: profile_id)
- ✅ `products` (FK: product_id)
- ✅ `orders` (FK: order_id)

**Verificación:**

```sql
SELECT * FROM public.reviews LIMIT 1;
```

---

### **Paso 11: Estadísticas de Productos** 📊

```sql
-- Archivo: tables/product_stats.sql
```

**Dependencias:**

- ✅ `products` (FK: product_id)
- ✅ `orders` (para calcular ventas)
- ✅ `order_items` (para calcular ventas)
- ✅ `reviews` (para calcular ratings)

**Nota:** Esta tabla tiene triggers que se actualizan automáticamente

**Verificación:**

```sql
SELECT * FROM public.product_stats LIMIT 1;

-- Verificar función de actualización
SELECT proname FROM pg_proc WHERE proname = 'update_product_stats';
```

---

### **Paso 12: Roles de Administrador** 👑 (IMPORTANTE)

```sql
-- Archivo: tables/admin_roles.sql
```

**Dependencias:**

- ✅ `profiles` (FK: profile_id)

**Nota:** Este archivo crea las funciones helper de admin:

- `is_admin()`
- `is_super_admin()`
- `has_admin_permission()`
- `get_user_admin_role()`

**Verificación:**

```sql
SELECT * FROM public.admin_roles LIMIT 1;

-- Verificar funciones de admin
SELECT proname FROM pg_proc
WHERE proname IN ('is_admin', 'is_super_admin', 'has_admin_permission', 'get_user_admin_role');
```

---

### **Paso 13: Crear Primer Super Admin** 🔑 (ÚLTIMO)

```sql
-- Archivo: scripts/seed_admin.sql
```

**⚠️ IMPORTANTE: Antes de ejecutar este archivo:**

1. **Crea tu primer usuario:**

   - Ve a **Authentication** en Supabase
   - Haz click en **Add User** → **Create new user**
   - O regístrate desde tu app

2. **Copia el UUID del usuario:**

   - Ve a **Authentication** → **Users**
   - Copia el UUID (ej: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

3. **Edita el archivo `scripts/seed_admin.sql`:**

   - Busca la línea: `'TU-USER-ID-AQUI'::UUID`
   - Reemplázala con: `'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::UUID`

4. **Ejecuta el script modificado**

**Verificación:**

```sql
-- Ver tu usuario como admin
SELECT
  p.email,
  p.full_name,
  ar.role,
  ar.can_manage_products,
  ar.can_manage_orders
FROM public.admin_roles ar
JOIN public.profiles p ON p.id = ar.profile_id
WHERE ar.profile_id = auth.uid();

-- Verificar si eres admin
SELECT is_admin() as soy_admin;

-- Verificar si eres super admin
SELECT is_super_admin() as soy_super_admin;
```

---

### **Paso 14: Insertar Métodos de Pago** 💰 (OPCIONAL)

```sql
-- Archivo: scripts/seed_payment_methods.sql
```

**Este paso es OPCIONAL pero recomendado.**

**⚠️ IMPORTANTE: Antes de ejecutar:**

1. **Abre el archivo `scripts/seed_payment_methods.sql`**
2. **Personaliza los `payment_details`** con tus datos reales:
   - Número de cuenta bancaria
   - Teléfono para pago móvil
   - Email de Zelle, etc.
3. **Activa/desactiva** los métodos que necesites

**¿Qué hace este script?**

- Inserta métodos de pago de ejemplo (transferencia, pago móvil, Zelle, etc.)
- Usa `ON CONFLICT DO UPDATE` (puedes ejecutarlo múltiples veces)
- Los datos se guardan en formato JSONB flexible

**Verificación:**

```sql
-- Ver todos los métodos de pago activos
SELECT
  name,
  code,
  is_active,
  display_order,
  payment_details
FROM public.payment_methods
WHERE is_active = TRUE
ORDER BY display_order;
```

**Personalizar después:**

```sql
-- Ejemplo: Actualizar datos de transferencia bancaria
UPDATE payment_methods
SET payment_details = '{
  "bank": "Tu Banco Real",
  "account_number": "0102-xxxx-xxxx-xxxx",
  "owner_name": "Tu Empresa S.A.",
  "rif": "J-xxxxxxxx-x"
}'::JSONB
WHERE code = 'bank_transfer';
```

---

## ✅ Verificación Final

Ejecuta este script para verificar que todas las tablas fueron creadas:

```sql
-- Ver todas las tablas creadas en el schema public
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as num_columns
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Resultado esperado: 12 tablas
-- addresses, admin_roles, cart, cart_items, categories,
-- order_items, orders, payment_methods, product_stats,
-- products, profiles, reviews
```

Verificar funciones creadas:

```sql
-- Ver todas las funciones personalizadas
SELECT
  proname as function_name,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND prokind = 'f'
ORDER BY proname;

-- Deberías ver:
-- ✅ update_updated_at_column()
-- ✅ handle_new_user()
-- ✅ ensure_single_default_address()
-- ✅ is_admin()
-- ✅ is_super_admin()
-- ✅ has_admin_permission(text)
-- ✅ get_user_admin_role()
-- ✅ update_product_stats(uuid)
-- ✅ set_cart_item_price()
-- ✅ generate_order_number()
-- ✅ update_order_status_timestamps()
-- ✅ calculate_order_item_subtotal()
-- ✅ copy_product_info_to_order_item()
-- ✅ verify_purchase_on_review()
-- Y funciones de triggers
```

---

## 🎯 Resumen Rápido - Orden de Ejecución

Para copiar y tener a mano:

```
1.  tables/profiles.sql            ⭐ PRIMERO (crea funciones base)
2.  tables/addresses.sql
3.  tables/categories.sql
4.  tables/products.sql            (con imágenes en JSONB)
5.  tables/cart.sql
6.  tables/cart_items.sql
7.  tables/payment_methods.sql     💳 (métodos de pago)
8.  tables/orders.sql              (crea ENUM order_status)
9.  tables/order_items.sql
10. tables/reviews.sql
11. tables/product_stats.sql
12. tables/admin_roles.sql         ⭐ (crea funciones de admin)
13. scripts/seed_admin.sql         🔑 (editar UUID primero)
14. scripts/seed_payment_methods.sql 💰 OPCIONAL (personalizar datos)
```

---

## 💡 Tips para el SQL Editor de Supabase

### **Método 1: Copiar y Pegar (Recomendado)**

1. Abre el archivo en tu editor de código
2. Copia TODO el contenido del archivo (Ctrl+A → Ctrl+C)
3. En Supabase SQL Editor, pega el contenido (Ctrl+V)
4. Click en **RUN** o presiona `Ctrl + Enter`
5. Espera el mensaje de éxito ✅
6. Repite con el siguiente archivo

### **Método 2: Upload de Archivo (Más Rápido)**

1. En SQL Editor, click en el botón **"+"** (New query)
2. Arrastra el archivo `.sql` directamente al editor
3. O usa **File** → **Upload SQL file**
4. Click en **RUN**

### **Método 3: Script Automatizado (Avanzado)**

Si prefieres ejecutar todo desde terminal con `psql`:

```bash
# Obtén tu connection string de Supabase
# Dashboard → Settings → Database → Connection string

export DATABASE_URL="postgresql://postgres:[password]@[host]:5432/postgres"

# Ejecuta en orden
cd tables/
psql $DATABASE_URL -f profiles.sql
psql $DATABASE_URL -f addresses.sql
psql $DATABASE_URL -f categories.sql
psql $DATABASE_URL -f products.sql
psql $DATABASE_URL -f product_images.sql
psql $DATABASE_URL -f cart.sql
psql $DATABASE_URL -f cart_items.sql
psql $DATABASE_URL -f orders.sql
psql $DATABASE_URL -f order_items.sql
psql $DATABASE_URL -f reviews.sql
psql $DATABASE_URL -f product_stats.sql
psql $DATABASE_URL -f admin_roles.sql

cd ../scripts/
# Edita seed_admin.sql primero con tu UUID
psql $DATABASE_URL -f seed_admin.sql
```

---

## ⚠️ Problemas Comunes y Soluciones

### **Error: "relation does not exist"**

**Causa:** Ejecutaste un archivo antes que sus dependencias  
**Solución:** Revisa el orden y ejecuta las dependencias primero

### **Error: "function update_updated_at_column() does not exist"**

**Causa:** No ejecutaste `profiles.sql` primero  
**Solución:** Ejecuta `profiles.sql` y luego vuelve a ejecutar el archivo que falló

### **Error: "type admin_role_type already exists"**

**Causa:** Estás re-ejecutando un archivo que crea tipos ENUM  
**Solución:** Ignora el error o elimina el tipo primero:

```sql
DROP TYPE IF EXISTS admin_role_type CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
```

### **Error: "duplicate key value violates unique constraint"**

**Causa:** Estás intentando insertar datos duplicados (probablemente en seed_admin.sql)  
**Solución:** El usuario admin ya existe, puedes ignorar el error

### **RLS Bloqueando Queries**

**Causa:** Row Level Security está activo  
**Solución temporal:** Desactiva RLS para testing:

```sql
ALTER TABLE nombre_tabla DISABLE ROW LEVEL SECURITY;
```

**Nota:** NO hacer esto en producción

---

## 🎉 ¡Listo!

Una vez ejecutados todos los archivos en orden:

1. ✅ Tienes 12 tablas creadas
2. ✅ Tienes 14+ funciones personalizadas
3. ✅ RLS habilitado en todas las tablas
4. ✅ Triggers automáticos funcionando
5. ✅ Tu usuario es super admin

**Próximos pasos:**

- Crear algunas categorías de prueba
- Agregar productos de ejemplo
- Probar el flujo de compra
- Conectar tu app Next.js

---

## 📚 Referencias

- **Documentación completa**: `docs/README.md`
- **Funciones de admin**: `docs/admin_functions_guide.md`
- **Implementación en frontend**: `docs/admin_implementation_guide.md`
- **Product stats**: `docs/product_stats_README.md`

---

**¿Dudas?** Revisa los archivos de documentación o consulta los comentarios en cada archivo SQL.

**¡Éxito con tu e-commerce!** 🚀🪵⚡
