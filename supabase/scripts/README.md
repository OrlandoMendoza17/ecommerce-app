# 🔧 Scripts de Inicialización

Esta carpeta contiene scripts de inicialización y configuración que **no son definiciones de tablas**.

## 📄 Archivos

### `seed_admin.sql`

Script para crear tu primer usuario super admin.

**Propósito**: Convertir un usuario registrado en Supabase Auth en super administrador de la tienda.

**Cuándo ejecutar**: Después de crear todas las tablas y de registrar tu primer usuario.

**Cómo usar**:

1. Regístrate en tu app (o crea un usuario en Supabase Dashboard)
2. Copia el UUID del usuario desde: Dashboard → Authentication → Users
3. Edita `seed_admin.sql` y reemplaza `'TU-USER-ID-AQUI'` con tu UUID
4. Ejecuta el script:
   ```bash
   psql -f seed_admin.sql
   ```

**Lo que hace**:

- Inserta un registro en `public.admin_roles` con el rol `super_admin`
- Activa todos los permisos (products, categories, orders, users, analytics, reviews)
- Permite que ese usuario acceda al panel de administración

**Verificación**:

```sql
-- Ver todos los administradores
SELECT p.email, ar.role, ar.created_at
FROM admin_roles ar
JOIN profiles p ON p.id = ar.profile_id;

-- Verificar si eres admin
SELECT is_admin() as soy_admin;
```

---

### `seed_payment_methods.sql`

Script para insertar los métodos de pago disponibles en tu tienda.

**Propósito**: Configurar los métodos de pago manuales (transferencia, pago móvil, etc.).

**Cuándo ejecutar**: Después de crear la tabla `payment_methods`.

**Lo que hace**:

- Inserta métodos de pago de ejemplo (transferencia bancaria, pago móvil, Zelle, etc.)
- Usa `ON CONFLICT DO UPDATE` para actualizar si ya existen
- Configura datos de pago en formato JSONB
- Define instrucciones para el cliente

**Personalizar**:

```sql
-- Edita los payment_details con tus datos reales
UPDATE payment_methods
SET payment_details = '{
  "bank": "Tu Banco",
  "account_number": "0102-xxxx-xxxx-xxxx",
  "owner_name": "Tu Empresa"
}'::JSONB
WHERE code = 'bank_transfer';
```

**Verificación**:

```sql
-- Ver todos los métodos activos
SELECT name, code, is_active, display_order
FROM payment_methods
WHERE is_active = TRUE
ORDER BY display_order;
```

---

### `migrate_add_product_options.sql`

Script de migración para añadir el sistema de opciones configurables de productos.

⚠️ **Solo ejecutar si ya tienes las tablas creadas y quieres actualizar al nuevo sistema.**

---

## 📝 Notas

- Este es un **script de datos**, no una definición de tabla
- Solo necesitas ejecutarlo una vez (por usuario admin)
- Puedes crear múltiples admins ejecutando el script con diferentes UUIDs
- Los ejemplos en el archivo muestran cómo crear admins con diferentes niveles de permisos

---

### Detalles: `migrate_add_product_options.sql`

**Propósito**: Migrar la estructura de productos de campos fijos a opciones configurables.

**Cuándo ejecutar**: Si ya tienes las tablas creadas y quieres actualizar al nuevo sistema de opciones.

**⚠️ NO ejecutar si**:

- Es tu primera instalación (usa los archivos en `tables/` directamente)
- Ya migraste antes

**Lo que hace**:

```
1. Añade dimension_options (TEXT[]) a products
2. Añade thickness_options (TEXT[]) a products
3. Elimina thickness_mm y dimensions_cm de products
4. Añade selected_dimension a cart_items
5. Añade selected_thickness a cart_items
6. Actualiza UNIQUE constraint en cart_items
7. Añade selected_dimension a order_items
8. Añade selected_thickness a order_items
```

**Cómo ejecutar**:

```sql
-- En Supabase SQL Editor:
-- Copiar y pegar el contenido completo de migrate_add_product_options.sql
-- Ejecutar
```

**Verificación**:

```sql
-- Verificar que los campos existen
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name IN ('products', 'cart_items', 'order_items')
AND column_name LIKE '%dimension%' OR column_name LIKE '%thickness%';
```

---

## 🔗 Ver También

- `../tables/admin_roles.sql` - Definición de la tabla de roles
- `../docs/admin_functions_guide.md` - Documentación de funciones SQL
- `../docs/product_options_guide.md` - Guía del sistema de opciones configurables
