-- =============================================================================
-- INIT DATABASE — E-commerce
-- =============================================================================
-- GENERADO por: npm run build:db
-- NO editar manualmente. Modifica archivos en tables/, functions/ y vuelve a generar.
--
-- Ejecutar UNA VEZ en Supabase → SQL Editor → Run (todo el archivo, en orden).
--
-- ORDEN DE ENTIDADES (dependencias FK y funciones)
-- ─────────────────────────────────────────────────────────────────────────────
--  1. profiles          + is_admin() + políticas RLS admin
--  2. addresses         → profiles
--  3. categories
--  4. products          → categories
--  5. product_option_types / values / variants / variant_option_values
--  6. cart              → profiles
--  7. cart_items        → cart, products, product_variants
--  8. payment_methods
--  9. store_settings     (singleton — config global)
-- 10. orders            → profiles, payment_methods
-- 11. order_items       → orders, products, product_variants + trigger
-- 12. reviews           → products, profiles, orders
-- 13. product_stats     → products
-- ─────────────────────────────────────────────────────────────────────────────
--
-- En DB quedan: is_admin() · trigger copy_product_info_to_order_item
-- Lógica en servidor (checklist): scripts/server_logic_checklist.md
--
-- BD existente (no instalación nueva): scripts/migrate_schema_updates.sql
--
-- Después (opcional):
--   scripts/seed_admin.sql
--   scripts/seed_payment_methods.sql
--   scripts/seed_store_settings.sql
-- =============================================================================


-- >>> tables/profiles.sql

-- ============================================
-- TABLA: public.profiles
-- Descripción: Perfiles de usuario extendidos
-- Funciones DB: functions/standalone/profiles/is_admin.sql
-- Lógica servidor: docs/server_logic_checklist.md (anti auto-promoción admin)
-- ============================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL DEFAULT '',
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  avatar_url TEXT NOT NULL DEFAULT '',
  
  -- Información adicional
  date_of_birth DATE,

  -- Rol: FALSE = cliente, TRUE = administrador (acceso al dashboard)
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Soft delete
  deleted_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON public.profiles(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = TRUE;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id AND deleted_at IS NULL);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Políticas de admin: tables/rls/profiles.sql (requieren is_admin())


-- <<< tables/profiles.sql


-- >>> functions/standalone/profiles/is_admin.sql

-- @type standalone
-- @entity profiles
-- Usada en políticas RLS de muchas tablas. Ejecutar antes de policies que llamen is_admin().

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND is_admin = TRUE
      AND deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_admin() IS
  'Retorna TRUE si el usuario actual es administrador (profiles.is_admin).';


-- <<< functions/standalone/profiles/is_admin.sql


-- >>> tables/rls/profiles.sql

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


-- <<< tables/rls/profiles.sql


-- >>> tables/addresses.sql

-- ============================================
-- TABLA: public.addresses
-- Descripción: Direcciones de envío de los usuarios
-- ============================================

CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Información de dirección
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  address_line1 TEXT NOT NULL DEFAULT '',
  address_line2 TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT '',
  postal_code TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT '',
  
  -- Flags
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_addresses_profile_id ON public.addresses(profile_id);

-- Una sola dirección predeterminada por usuario (la app debe desmarcar la anterior antes de marcar otra)
CREATE UNIQUE INDEX IF NOT EXISTS idx_addresses_one_default_per_profile
  ON public.addresses (profile_id)
  WHERE is_default = TRUE;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver sus propias direcciones
CREATE POLICY "Users can view own addresses"
  ON public.addresses
  FOR SELECT
  USING (auth.uid() = profile_id);

-- Los usuarios pueden insertar sus propias direcciones
CREATE POLICY "Users can insert own addresses"
  ON public.addresses
  FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

-- Los usuarios pueden actualizar sus propias direcciones
CREATE POLICY "Users can update own addresses"
  ON public.addresses
  FOR UPDATE
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- Los usuarios pueden eliminar sus propias direcciones
CREATE POLICY "Users can delete own addresses"
  ON public.addresses
  FOR DELETE
  USING (auth.uid() = profile_id);

-- Admins pueden ver todas las direcciones (para gestión de envíos)
CREATE POLICY "Admins can view all addresses"
  ON public.addresses
  FOR SELECT
  USING (is_admin());


-- <<< tables/addresses.sql


-- >>> tables/categories.sql

-- ============================================
-- TABLA: public.categories
-- Descripción: Categorías de productos
-- ============================================

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT '',
  slug TEXT NOT NULL UNIQUE DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  
  -- Orden de visualización
  display_order INTEGER NOT NULL DEFAULT 0,
  
  -- Estado
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON public.categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON public.categories(display_order);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver categorías activas
CREATE POLICY "Anyone can view active categories"
  ON public.categories
  FOR SELECT
  USING (is_active = TRUE);

-- Admins pueden ver todas las categorías (incluso inactivas)
CREATE POLICY "Admins can view all categories"
  ON public.categories
  FOR SELECT
  USING (is_admin());

-- Admins pueden insertar categorías
CREATE POLICY "Admins can insert categories"
  ON public.categories
  FOR INSERT
  WITH CHECK (is_admin());

-- Admins pueden actualizar categorías
CREATE POLICY "Admins can update categories"
  ON public.categories
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admins pueden eliminar categorías
CREATE POLICY "Admins can delete categories"
  ON public.categories
  FOR DELETE
  USING (is_admin());


-- <<< tables/categories.sql


-- >>> tables/products.sql

-- ============================================
-- TABLA: public.products
-- Descripción: Producto padre (catálogo). Precio/stock por variante.
-- ============================================

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,

  -- Información básica
  name TEXT NOT NULL DEFAULT '',
  slug TEXT NOT NULL UNIQUE DEFAULT '',
  description TEXT NOT NULL DEFAULT '',

  -- Resumen de catálogo (derivado de variantes; actualizar al guardar variantes)
  price DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  compare_at_price DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (compare_at_price >= 0),

  -- Atributos de catálogo (no generan SKU)
  brand TEXT NOT NULL DEFAULT '',
  condition TEXT NOT NULL DEFAULT 'new'
    CHECK (condition IN ('new', 'used', 'refurbished')),
  is_digital BOOLEAN NOT NULL DEFAULT FALSE,
  tags TEXT[] NOT NULL DEFAULT '{}',
  attributes JSONB NOT NULL DEFAULT '{}'::JSONB,

  -- Imágenes generales del producto
  images JSONB NOT NULL DEFAULT '[]'::JSONB,

  -- SEO
  meta_title TEXT NOT NULL DEFAULT '',
  meta_description TEXT NOT NULL DEFAULT '',

  -- Estado
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand) WHERE brand <> '';
CREATE INDEX IF NOT EXISTS idx_products_condition ON public.products(condition);
CREATE INDEX IF NOT EXISTS idx_products_tags ON public.products USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_products_attributes ON public.products USING GIN (attributes);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_active_category ON public.products(is_active, category_id)
  WHERE is_active = TRUE;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products"
  ON public.products
  FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admins can view all products"
  ON public.products
  FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert products"
  ON public.products
  FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update products"
  ON public.products
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete products"
  ON public.products
  FOR DELETE
  USING (is_admin());


-- <<< tables/products.sql


-- >>> tables/product_option_types.sql

-- ============================================
-- TABLA: product_option_types
-- Tipos de opción por producto (Color, Talla, Presentación, Sabor, Modelo…)
-- ============================================

CREATE TABLE IF NOT EXISTS public.product_option_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,

  name TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0 CHECK (display_order >= 0),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (product_id, name)
);

CREATE INDEX IF NOT EXISTS idx_product_option_types_product_id
  ON public.product_option_types(product_id);

ALTER TABLE public.product_option_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view option types of active products"
  ON public.product_option_types
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_option_types.product_id
        AND p.is_active = TRUE
    )
  );

CREATE POLICY "Admins can manage product option types"
  ON public.product_option_types
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());


-- <<< tables/product_option_types.sql


-- >>> tables/product_option_values.sql

-- ============================================
-- TABLA: product_option_values
-- Valores por tipo (Rojo, M, 500ml, Chocolate, iPhone 14…)
-- ============================================

CREATE TABLE IF NOT EXISTS public.product_option_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_type_id UUID NOT NULL
    REFERENCES public.product_option_types(id) ON DELETE CASCADE,

  value TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0 CHECK (display_order >= 0),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (option_type_id, value)
);

CREATE INDEX IF NOT EXISTS idx_product_option_values_option_type_id
  ON public.product_option_values(option_type_id);

ALTER TABLE public.product_option_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view option values of active products"
  ON public.product_option_values
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.product_option_types pot
      JOIN public.products p ON p.id = pot.product_id
      WHERE pot.id = product_option_values.option_type_id
        AND p.is_active = TRUE
    )
  );

CREATE POLICY "Admins can manage product option values"
  ON public.product_option_values
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());


-- <<< tables/product_option_values.sql


-- >>> tables/product_variants.sql

-- ============================================
-- TABLA: product_variants
-- Una fila = combinación vendible (SKU, precio, stock)
-- ============================================

CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,

  sku TEXT NOT NULL DEFAULT '',
  price DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  compare_at_price DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (compare_at_price >= 0),
  cost DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (cost >= 0),

  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  low_stock_threshold INTEGER NOT NULL DEFAULT 0 CHECK (low_stock_threshold >= 0),
  allow_backorder BOOLEAN NOT NULL DEFAULT FALSE,

  images JSONB NOT NULL DEFAULT '[]'::JSONB,

  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT product_variants_reserved_lte_stock
    CHECK (reserved_quantity <= stock_quantity OR allow_backorder = TRUE)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_variants_sku_unique
  ON public.product_variants(sku)
  WHERE sku <> '';

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id
  ON public.product_variants(product_id);

CREATE INDEX IF NOT EXISTS idx_product_variants_stock
  ON public.product_variants(stock_quantity);

CREATE INDEX IF NOT EXISTS idx_product_variants_active
  ON public.product_variants(product_id, is_active)
  WHERE is_active = TRUE;

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active variants of active products"
  ON public.product_variants
  FOR SELECT
  USING (
    is_active = TRUE
    AND EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_variants.product_id
        AND p.is_active = TRUE
    )
  );

CREATE POLICY "Admins can manage product variants"
  ON public.product_variants
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());


-- <<< tables/product_variants.sql


-- >>> tables/variant_option_values.sql

-- ============================================
-- TABLA: variant_option_values
-- Une cada variante con un valor por tipo de opción
-- ============================================

CREATE TABLE IF NOT EXISTS public.variant_option_values (
  variant_id UUID NOT NULL
    REFERENCES public.product_variants(id) ON DELETE CASCADE,
  option_value_id UUID NOT NULL
    REFERENCES public.product_option_values(id) ON DELETE CASCADE,

  PRIMARY KEY (variant_id, option_value_id)
);

CREATE INDEX IF NOT EXISTS idx_variant_option_values_variant_id
  ON public.variant_option_values(variant_id);

CREATE INDEX IF NOT EXISTS idx_variant_option_values_option_value_id
  ON public.variant_option_values(option_value_id);

ALTER TABLE public.variant_option_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view variant options of active products"
  ON public.variant_option_values
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.product_variants pv
      JOIN public.products p ON p.id = pv.product_id
      WHERE pv.id = variant_option_values.variant_id
        AND pv.is_active = TRUE
        AND p.is_active = TRUE
    )
  );

CREATE POLICY "Admins can manage variant option values"
  ON public.variant_option_values
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());


-- <<< tables/variant_option_values.sql


-- >>> tables/cart.sql

-- ============================================
-- TABLA: cart
-- Descripción: Carritos de compra de los usuarios
-- ============================================

CREATE TABLE IF NOT EXISTS public.cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL DEFAULT '', -- Vacío si el carrito es de usuario autenticado
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraint: carrito autenticado (profile_id + session_id '') o invitado (session_id con valor)
  CONSTRAINT check_cart_owner CHECK (
    (profile_id IS NOT NULL AND session_id = '') OR
    (profile_id IS NULL AND session_id <> '')
  )
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_cart_profile_id ON public.cart(profile_id);
CREATE INDEX IF NOT EXISTS idx_cart_session_id ON public.cart(session_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_unique_profile ON cart(profile_id) WHERE profile_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_unique_session ON cart(session_id) WHERE session_id <> '';

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver su propio carrito
CREATE POLICY "Users can view own cart"
  ON public.cart
  FOR SELECT
  USING (
    auth.uid() = profile_id OR
    session_id <> '' -- Carrito de invitado (manejar en app level)
  );

-- Los usuarios pueden crear su propio carrito
CREATE POLICY "Users can create own cart"
  ON public.cart
  FOR INSERT
  WITH CHECK (
    auth.uid() = profile_id OR
    session_id <> ''
  );

-- Los usuarios pueden actualizar su propio carrito
CREATE POLICY "Users can update own cart"
  ON public.cart
  FOR UPDATE
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- Los usuarios pueden eliminar su propio carrito
CREATE POLICY "Users can delete own cart"
  ON public.cart
  FOR DELETE
  USING (auth.uid() = profile_id);


-- <<< tables/cart.sql


-- >>> tables/cart_items.sql

-- ============================================
-- TABLA: cart_items
-- Descripción: Items individuales en el carrito
-- ============================================
-- Precio en vivo desde product_variants.price. Snapshot al crear order_items.

CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES public.cart(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,

  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),

  customization_text TEXT NOT NULL DEFAULT '',
  customization_notes TEXT NOT NULL DEFAULT '',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (cart_id, variant_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON public.cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON public.cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_variant_id ON public.cart_items(variant_id);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cart items"
  ON public.cart_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cart
      WHERE cart.id = cart_items.cart_id
        AND cart.profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own cart items"
  ON public.cart_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cart
      WHERE cart.id = cart_items.cart_id
        AND cart.profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own cart items"
  ON public.cart_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.cart
      WHERE cart.id = cart_items.cart_id
        AND cart.profile_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cart
      WHERE cart.id = cart_items.cart_id
        AND cart.profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own cart items"
  ON public.cart_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.cart
      WHERE cart.id = cart_items.cart_id
        AND cart.profile_id = auth.uid()
    )
  );


-- <<< tables/cart_items.sql


-- >>> tables/payment_methods.sql

-- ============================================
-- TABLA: public.payment_methods
-- Descripción: Métodos de pago disponibles (transferencia, pago móvil, etc.)
-- ============================================

CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL DEFAULT '',
  type VARCHAR(50) NOT NULL DEFAULT 'pago_movil' CHECK (type IN ('pago_movil', 'zinli', 'zelle', 'binance', 'transferencia_bancaria')),
  payment_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_payment_methods_type ON public.payment_methods(type);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_active ON public.payment_methods(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_methods_deleted_at ON public.payment_methods(deleted_at) WHERE deleted_at IS NULL;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver métodos de pago activos (no eliminados)
CREATE POLICY "Anyone can view active payment methods"
  ON public.payment_methods
  FOR SELECT
  USING (is_active = TRUE AND deleted_at IS NULL);

-- Admins pueden ver todos los métodos
CREATE POLICY "Admins can view all payment methods"
  ON public.payment_methods
  FOR SELECT
  USING (is_admin());

-- Admins pueden insertar métodos de pago
CREATE POLICY "Admins can insert payment methods"
  ON public.payment_methods
  FOR INSERT
  WITH CHECK (is_admin());

-- Admins pueden actualizar métodos de pago
CREATE POLICY "Admins can update payment methods"
  ON public.payment_methods
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admins pueden eliminar métodos de pago
CREATE POLICY "Admins can delete payment methods"
  ON public.payment_methods
  FOR DELETE
  USING (is_admin());
-- ============================================
-- DATOS DE EJEMPLO (COMENTADOS)
-- ============================================

/*
INSERT INTO public.payment_methods (name, type, payment_details) VALUES (
  'Transferencia Bancaria',
  'transferencia_bancaria',
  '{
    "bank": "Banco Nacional",
    "account_type": "Cuenta Corriente",
    "account_number": "0102-1234-5678-9012",
    "owner_name": "Mi Empresa S.A.",
    "rif": "J-12345678-9"
  }'::jsonb
);

INSERT INTO public.payment_methods (name, type, payment_details) VALUES (
  'Pago Móvil',
  'pago_movil',
  '{
    "bank": "Banco Nacional",
    "phone": "0424-1234567",
    "id_number": "V-12345678",
    "owner_name": "Nombre Titular"
  }'::jsonb
);

INSERT INTO public.payment_methods (name, type, payment_details) VALUES (
  'Zelle',
  'zelle',
  '{
    "email": "pagos@miempresa.com",
    "phone": "+1-555-123-4567"
  }'::jsonb
);
*/


-- <<< tables/payment_methods.sql


-- >>> tables/store_settings.sql

-- ============================================
-- TABLA: public.store_settings
-- Descripción: Configuración global de la tienda (una sola fila)
-- ============================================

CREATE TABLE IF NOT EXISTS public.store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Garantiza una única fila de configuración
  singleton BOOLEAN NOT NULL DEFAULT TRUE UNIQUE,

  -- Identidad de marca
  site_name TEXT NOT NULL DEFAULT '',
  site_tagline TEXT NOT NULL DEFAULT '',
  logo_url TEXT NOT NULL DEFAULT '',
  favicon_url TEXT NOT NULL DEFAULT '',
  og_image_url TEXT NOT NULL DEFAULT '',

  -- SEO global
  meta_title TEXT NOT NULL DEFAULT '',
  meta_description TEXT NOT NULL DEFAULT '',
  canonical_base_url TEXT NOT NULL DEFAULT '',
  default_locale TEXT NOT NULL DEFAULT 'es-VE',
  robots_index BOOLEAN NOT NULL DEFAULT TRUE,

  -- Contacto
  support_email TEXT NOT NULL DEFAULT '',
  support_phone TEXT NOT NULL DEFAULT '',
  whatsapp_number TEXT NOT NULL DEFAULT '',
  footer_text TEXT NOT NULL DEFAULT '',

  -- Redes sociales
  social_instagram TEXT NOT NULL DEFAULT '',
  social_facebook TEXT NOT NULL DEFAULT '',
  social_tiktok TEXT NOT NULL DEFAULT '',

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Storefront: lectura pública (logo, SEO, redes, contacto)
CREATE POLICY "Anyone can view store settings"
  ON public.store_settings
  FOR SELECT
  USING (TRUE);

-- Solo admins pueden crear la fila inicial
CREATE POLICY "Admins can insert store settings"
  ON public.store_settings
  FOR INSERT
  WITH CHECK (is_admin());

-- Solo admins pueden actualizar
CREATE POLICY "Admins can update store settings"
  ON public.store_settings
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());


-- <<< tables/store_settings.sql


-- >>> tables/orders.sql

-- ============================================
-- TABLA: orders
-- Descripción: Órdenes de compra
-- ============================================

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  
  -- Número de orden legible
  order_number TEXT NOT NULL UNIQUE DEFAULT '',
  
  -- Estado del pedido (fulfillment + pago)
  status VARCHAR(50) NOT NULL DEFAULT 'pending_payment' CHECK (status IN (
    'pending_payment',
    'payment_submitted',
    'payment_confirmed',
    'shipped',
    'delivered',
    'cancelled',
    'refunded'
  )),
  
  -- Totales
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  tax DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (tax >= 0),
  shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
  discount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  total DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  
  -- Información de envío (desnormalizada para mantener histórico)
  shipping_delivery_mode TEXT NOT NULL DEFAULT 'pending'
    CHECK (shipping_delivery_mode IN ('pending', 'address', 'coordinate')),
  shipping_full_name TEXT NOT NULL DEFAULT '',
  shipping_phone TEXT NOT NULL DEFAULT '',
  shipping_address_line1 TEXT NOT NULL DEFAULT '',
  shipping_address_line2 TEXT NOT NULL DEFAULT '',
  shipping_city TEXT NOT NULL DEFAULT '',
  shipping_state TEXT NOT NULL DEFAULT '',
  shipping_postal_code TEXT NOT NULL DEFAULT '',
  shipping_country TEXT NOT NULL DEFAULT '',
  
  -- Información de pago
  payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (payment_status IN (
    'pending',
    'submitted',
    'confirmed',
    'failed'
  )),
  payment_reference TEXT NOT NULL DEFAULT '',
  payment_proof_url TEXT NOT NULL DEFAULT '',
  issuer_bank TEXT NOT NULL DEFAULT '',       -- banco emisor (solo pago_movil / transferencia_bancaria)
  paid_at TIMESTAMPTZ,

  -- Moneda y montos de pago (Opción A — columnas paralelas)
  -- Los campos base (subtotal, total, etc.) siempre están en USD.
  -- Estos campos reflejan exactamente lo que pagó el cliente.
  -- DEFAULT 'USD'/1.0/0 hasta que el cliente reporte el pago.
  payment_currency VARCHAR(3) NOT NULL DEFAULT 'USD',       -- 'USD', 'VES', 'EUR'
  payment_exchange_rate DECIMAL(15,4) NOT NULL DEFAULT 1.0, -- tasa USD→moneda congelada al pagar
  paid_total DECIMAL(15,2) NOT NULL DEFAULT 0,              -- total en la moneda de pago
  
  -- Información de envío
  tracking_number TEXT NOT NULL DEFAULT '',
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  
  -- Notas
  customer_notes TEXT NOT NULL DEFAULT '',
  admin_notes TEXT NOT NULL DEFAULT '',
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_orders_profile_id ON public.orders(profile_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method_id ON public.orders(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_profile_status ON public.orders(profile_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_tracking ON public.orders(tracking_number) WHERE tracking_number <> '';
CREATE INDEX IF NOT EXISTS idx_orders_pending_payment_expiry
  ON public.orders(created_at)
  WHERE status = 'pending_payment';

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON public.orders
  FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can create orders"
  ON public.orders
  FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Admins can view all orders"
  ON public.orders
  FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can update orders"
  ON public.orders
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- El cliente puede reportar pago en pedidos propios con pago pendiente
CREATE POLICY "Users can submit payment on own pending orders"
  ON public.orders
  FOR UPDATE
  USING (auth.uid() = profile_id AND status = 'pending_payment')
  WITH CHECK (auth.uid() = profile_id);

-- Lógica servidor: docs/server_logic_checklist.md (order_number, fechas de status)


-- <<< tables/orders.sql


-- >>> tables/order_items.sql

-- ============================================
-- TABLA: order_items
-- Descripción: Items individuales de cada orden
-- ============================================

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,

  product_name TEXT NOT NULL DEFAULT '',
  product_sku TEXT NOT NULL DEFAULT '',
  product_image_url TEXT NOT NULL DEFAULT '',
  variant_sku TEXT NOT NULL DEFAULT '',

  selected_options JSONB NOT NULL DEFAULT '{}'::JSONB,

  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),

  -- Precios en la moneda de pago (DEFAULT 0 hasta que el cliente reporte el pago)
  paid_unit_price DECIMAL(15,2) NOT NULL DEFAULT 0,
  paid_subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,

  customization_text TEXT NOT NULL DEFAULT '',
  customization_notes TEXT NOT NULL DEFAULT '',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON public.order_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_selected_options ON public.order_items USING GIN (selected_options);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items"
  ON public.order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own order items"
  ON public.order_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.profile_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all order items"
  ON public.order_items
  FOR SELECT
  USING (is_admin());


-- <<< tables/order_items.sql


-- >>> functions/triggers/order_items/copy_product_info_to_order_item.sql

-- @type trigger
-- @entity order_items
-- @table public.order_items
-- @event BEFORE INSERT
-- Snapshot de variante (precio, sku, opciones) o producto padre si no hay variant_id.

CREATE OR REPLACE FUNCTION public.copy_product_info_to_order_item()
RETURNS TRIGGER AS $$
DECLARE
  product_row RECORD;
  variant_row RECORD;
  options_snapshot JSONB;
BEGIN
  IF NEW.variant_id IS NOT NULL THEN
    SELECT
      p.name,
      p.images,
      v.sku AS variant_sku,
      v.price,
      v.images AS variant_images
    INTO variant_row
    FROM public.product_variants v
    JOIN public.products p ON p.id = v.product_id
    WHERE v.id = NEW.variant_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Variante no encontrada: %', NEW.variant_id;
    END IF;

    NEW.unit_price := variant_row.price;

    IF NEW.product_name IS NULL OR NEW.product_name = '' THEN
      NEW.product_name := variant_row.name;
      NEW.product_sku := COALESCE(variant_row.variant_sku, '');
      NEW.variant_sku := COALESCE(variant_row.variant_sku, '');
      NEW.product_image_url := COALESCE(
        variant_row.variant_images->>0,
        variant_row.images->>0,
        ''
      );
    END IF;

    SELECT COALESCE(
      jsonb_object_agg(pot.name, pov.value ORDER BY pot.display_order),
      '{}'::JSONB
    )
    INTO options_snapshot
    FROM public.variant_option_values vov
    JOIN public.product_option_values pov ON pov.id = vov.option_value_id
    JOIN public.product_option_types pot ON pot.id = pov.option_type_id
    WHERE vov.variant_id = NEW.variant_id;

    NEW.selected_options := COALESCE(options_snapshot, '{}'::JSONB);

  ELSE
    SELECT
      name,
      COALESCE(images->>0, '') AS image_url,
      price
    INTO product_row
    FROM public.products
    WHERE id = NEW.product_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Producto no encontrado: %', NEW.product_id;
    END IF;

    NEW.unit_price := product_row.price;

    IF NEW.product_name IS NULL OR NEW.product_name = '' THEN
      NEW.product_name := product_row.name;
      NEW.product_sku := '';
      NEW.variant_sku := '';
      NEW.product_image_url := product_row.image_url;
      NEW.selected_options := '{}'::JSONB;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.copy_product_info_to_order_item() IS
  'Trigger: snapshot de variante (precio, sku, opciones JSON) o producto padre si no hay variant_id.';

CREATE TRIGGER trigger_1_copy_product_info
  BEFORE INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.copy_product_info_to_order_item();


-- <<< functions/triggers/order_items/copy_product_info_to_order_item.sql


-- >>> functions/standalone/orders/create_order_from_cart.sql

-- @type standalone
-- @entity orders
-- Crea un pedido desde el carrito del usuario y reserva stock de forma atómica.

CREATE OR REPLACE FUNCTION public.create_order_from_cart(
  p_user_id      UUID,
  p_order_number TEXT
)
RETURNS TABLE (id UUID, order_number TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_cart_id      UUID;
  v_order_id     UUID;
  v_item         RECORD;
  v_profile      RECORD;
  v_subtotal     DECIMAL(10,2) := 0;
  v_rows_updated INTEGER;
BEGIN
  SELECT c.id INTO v_cart_id
    FROM public.cart c
   WHERE c.profile_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tu carrito está vacío'
      USING ERRCODE = 'P0001';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.cart_items ci WHERE ci.cart_id = v_cart_id
  ) THEN
    RAISE EXCEPTION 'Tu carrito está vacío'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT p.full_name, p.phone
    INTO v_profile
    FROM public.profiles p
   WHERE p.id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil no encontrado'
      USING ERRCODE = 'P0002';
  END IF;

  FOR v_item IN
    SELECT
      ci.product_id,
      ci.variant_id,
      ci.quantity,
      ci.customization_text,
      ci.customization_notes,
      pr.name AS product_name,
      pr.is_active AS product_active,
      pv.is_active AS variant_active,
      pv.allow_backorder,
      pv.stock_quantity,
      pv.reserved_quantity
    FROM public.cart_items ci
    JOIN public.products pr ON pr.id = ci.product_id
    JOIN public.product_variants pv ON pv.id = ci.variant_id
   WHERE ci.cart_id = v_cart_id
  LOOP
    IF NOT v_item.product_active OR NOT v_item.variant_active THEN
      RAISE EXCEPTION 'Uno o más productos ya no están disponibles'
        USING ERRCODE = 'P0003';
    END IF;

    IF NOT v_item.allow_backorder
       AND (v_item.stock_quantity - v_item.reserved_quantity) < v_item.quantity THEN
      RAISE EXCEPTION 'Stock insuficiente para "%" (disponible: %, solicitado: %)',
        v_item.product_name,
        GREATEST(0, v_item.stock_quantity - v_item.reserved_quantity),
        v_item.quantity
        USING ERRCODE = 'P0004';
    END IF;

    UPDATE public.product_variants pv
       SET reserved_quantity = pv.reserved_quantity + v_item.quantity,
           updated_at = NOW()
     WHERE pv.id = v_item.variant_id
       AND (
         pv.allow_backorder = TRUE
         OR (pv.stock_quantity - pv.reserved_quantity) >= v_item.quantity
       );

    GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
    IF v_rows_updated = 0 THEN
      RAISE EXCEPTION 'No se pudo reservar stock para "%"', v_item.product_name
        USING ERRCODE = 'P0004';
    END IF;
  END LOOP;

  INSERT INTO public.orders (
    profile_id,
    order_number,
    status,
    payment_status,
    subtotal,
    tax,
    shipping_cost,
    discount,
    total,
    shipping_delivery_mode,
    shipping_full_name,
    shipping_phone,
    shipping_address_line1,
    shipping_address_line2,
    shipping_city,
    shipping_state,
    shipping_postal_code,
    shipping_country
  ) VALUES (
    p_user_id,
    p_order_number,
    'pending_payment',
    'pending',
    0, 0, 0, 0, 0,
    'pending',
    COALESCE(v_profile.full_name, ''),
    COALESCE(v_profile.phone, ''),
    '', '', '', '', '', ''
  )
  RETURNING public.orders.id INTO v_order_id;

  FOR v_item IN
    SELECT
      ci.product_id,
      ci.variant_id,
      ci.quantity,
      ci.customization_text,
      ci.customization_notes
    FROM public.cart_items ci
   WHERE ci.cart_id = v_cart_id
  LOOP
    INSERT INTO public.order_items (
      order_id,
      product_id,
      variant_id,
      quantity,
      customization_text,
      customization_notes,
      unit_price,
      subtotal
    ) VALUES (
      v_order_id,
      v_item.product_id,
      v_item.variant_id,
      v_item.quantity,
      v_item.customization_text,
      v_item.customization_notes,
      0,
      0
    );
  END LOOP;

  UPDATE public.order_items oi
     SET subtotal = oi.quantity * oi.unit_price
   WHERE oi.order_id = v_order_id;

  SELECT COALESCE(SUM(oi.subtotal), 0)
    INTO v_subtotal
    FROM public.order_items oi
   WHERE oi.order_id = v_order_id;

  UPDATE public.orders o
     SET subtotal = v_subtotal,
         total = v_subtotal,
         updated_at = NOW()
   WHERE o.id = v_order_id;

  DELETE FROM public.cart_items ci WHERE ci.cart_id = v_cart_id;

  RETURN QUERY
    SELECT v_order_id, p_order_number;
END;
$$;

COMMENT ON FUNCTION public.create_order_from_cart(UUID, TEXT) IS
  'Crea pedido desde carrito con shipping_delivery_mode = pending. Llama a set_order_shipping en el paso de pago.';


-- <<< functions/standalone/orders/create_order_from_cart.sql


-- >>> functions/standalone/orders/set_order_shipping.sql

-- @type standalone
-- @entity orders
-- Guarda el modo de entrega del pedido (address | coordinate) y copia los datos de dirección.

CREATE OR REPLACE FUNCTION public.set_order_shipping(
  p_order_id   UUID,
  p_user_id    UUID,
  p_mode       TEXT,
  p_address_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_order   RECORD;
  v_address RECORD;
  v_profile RECORD;
BEGIN
  SELECT o.id, o.profile_id, o.status
    INTO v_order
    FROM public.orders o
   WHERE o.id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido no encontrado'
      USING ERRCODE = 'P0001';
  END IF;

  IF v_order.profile_id <> p_user_id THEN
    RAISE EXCEPTION 'No tienes acceso a este pedido'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_order.status <> 'pending_payment' THEN
    RAISE EXCEPTION 'Solo se puede modificar la dirección de un pedido pendiente de pago'
      USING ERRCODE = 'P0003';
  END IF;

  IF p_mode NOT IN ('address', 'coordinate') THEN
    RAISE EXCEPTION 'Modo de entrega no válido: %', p_mode
      USING ERRCODE = 'P0005';
  END IF;

  SELECT p.full_name, p.phone
    INTO v_profile
    FROM public.profiles p
   WHERE p.id = p_user_id;

  IF p_mode = 'address' THEN
    IF p_address_id IS NULL THEN
      RAISE EXCEPTION 'Debes seleccionar una dirección de envío'
        USING ERRCODE = 'P0005';
    END IF;

    SELECT
      a.full_name,
      a.phone,
      a.address_line1,
      a.address_line2,
      a.city,
      a.state,
      a.postal_code,
      a.country
      INTO v_address
      FROM public.addresses a
     WHERE a.id = p_address_id
       AND a.profile_id = p_user_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Dirección no encontrada o no pertenece a tu cuenta'
        USING ERRCODE = 'P0005';
    END IF;

    IF trim(v_address.address_line1) = ''
       OR trim(v_address.city) = ''
       OR trim(v_address.state) = '' THEN
      RAISE EXCEPTION 'La dirección seleccionada está incompleta. Actualízala en tu perfil.'
        USING ERRCODE = 'P0005';
    END IF;

    UPDATE public.orders
       SET shipping_delivery_mode  = 'address',
           shipping_full_name      = COALESCE(NULLIF(trim(v_address.full_name), ''), v_profile.full_name, ''),
           shipping_phone          = COALESCE(NULLIF(trim(v_address.phone), ''), v_profile.phone, ''),
           shipping_address_line1  = trim(v_address.address_line1),
           shipping_address_line2  = COALESCE(v_address.address_line2, ''),
           shipping_city           = trim(v_address.city),
           shipping_state          = trim(v_address.state),
           shipping_postal_code    = COALESCE(v_address.postal_code, ''),
           shipping_country        = COALESCE(NULLIF(trim(v_address.country), ''), 'VE'),
           updated_at              = NOW()
     WHERE id = p_order_id;

  ELSE -- 'coordinate'
    UPDATE public.orders
       SET shipping_delivery_mode  = 'coordinate',
           shipping_full_name      = COALESCE(v_profile.full_name, ''),
           shipping_phone          = COALESCE(v_profile.phone, ''),
           shipping_address_line1  = '',
           shipping_address_line2  = '',
           shipping_city           = '',
           shipping_state          = '',
           shipping_postal_code    = '',
           shipping_country        = '',
           updated_at              = NOW()
     WHERE id = p_order_id;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.set_order_shipping(UUID, UUID, TEXT, UUID) IS
  'Guarda el modo de entrega (address | coordinate) y copia los campos shipping_* al pedido.';

-- <<< functions/standalone/orders/set_order_shipping.sql


-- >>> functions/standalone/orders/submit_order_payment.sql

-- @type standalone
-- @entity orders
-- El cliente reporta su pago. No descuenta stock ni confirma el pedido.
-- Captura la moneda del método de pago y congela la tasa vigente.

CREATE OR REPLACE FUNCTION public.submit_order_payment(
  p_order_id          UUID,
  p_user_id           UUID,
  p_payment_method_id UUID,
  p_payment_reference TEXT,
  p_payment_date      DATE,
  p_issuer_bank       TEXT,
  p_payment_proof_url TEXT DEFAULT ''
)
RETURNS TABLE (id UUID, order_number TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_order           RECORD;
  v_method          RECORD;
  v_currency        VARCHAR(3);
  v_exchange_rate   DECIMAL(15,4);
  v_paid_total      DECIMAL(15,2);
  v_issuer_bank     TEXT;
  v_item            RECORD;
BEGIN
  -- ── 1. Validar orden ─────────────────────────────────────────────────────
  SELECT o.id, o.profile_id, o.status, o.total
    INTO v_order
    FROM public.orders o
   WHERE o.id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido no encontrado: %', p_order_id
      USING ERRCODE = 'P0001';
  END IF;

  IF v_order.profile_id <> p_user_id THEN
    RAISE EXCEPTION 'No tienes acceso a este pedido'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_order.status <> 'pending_payment' THEN
    RAISE EXCEPTION 'Este pedido ya no acepta datos de pago (estado: %)', v_order.status
      USING ERRCODE = 'P0003';
  END IF;

  -- ── 2. Validar método de pago y derivar moneda ────────────────────────────
  SELECT m.id, m.is_active, m.type
    INTO v_method
    FROM public.payment_methods m
   WHERE m.id = p_payment_method_id
     AND m.deleted_at IS NULL;

  IF NOT FOUND OR NOT v_method.is_active THEN
    RAISE EXCEPTION 'Método de pago no válido o inactivo'
      USING ERRCODE = 'P0004';
  END IF;

  v_currency := CASE lower(trim(v_method.type))
    WHEN 'pago_movil'             THEN 'VES'
    WHEN 'transferencia_bancaria' THEN 'VES'
    WHEN 'zelle'                  THEN 'USD'
    WHEN 'zinli'                  THEN 'USD'
    WHEN 'binance'                THEN 'USD'
    ELSE NULL
  END;

  IF v_currency IS NULL THEN
    RAISE EXCEPTION 'Tipo de método de pago no reconocido: %', v_method.type
      USING ERRCODE = 'P0005';
  END IF;

  -- ── 3. Banco emisor (solo métodos VES) ────────────────────────────────────
  IF v_currency = 'VES' THEN
    v_issuer_bank := trim(COALESCE(p_issuer_bank, ''));
    IF v_issuer_bank = '' THEN
      RAISE EXCEPTION 'El banco emisor es obligatorio para este método de pago'
        USING ERRCODE = 'P0007';
    END IF;
  ELSE
    v_issuer_bank := '';
  END IF;

  -- ── 4. Obtener tasa de cambio vigente ──────────────────────────────────────
  IF v_currency = 'VES' THEN
    SELECT er."USD"
      INTO v_exchange_rate
      FROM public.exchange_rates er
     ORDER BY er.created_at DESC
     LIMIT 1;

    IF NOT FOUND OR v_exchange_rate IS NULL OR v_exchange_rate = 0 THEN
      RAISE EXCEPTION 'No hay tasa de cambio disponible. Intenta más tarde.'
        USING ERRCODE = 'P0006';
    END IF;
  ELSIF v_currency = 'EUR' THEN
    SELECT er."EUR"
      INTO v_exchange_rate
      FROM public.exchange_rates er
     ORDER BY er.created_at DESC
     LIMIT 1;

    IF NOT FOUND OR v_exchange_rate IS NULL OR v_exchange_rate = 0 THEN
      RAISE EXCEPTION 'No hay tasa de cambio EUR disponible. Intenta más tarde.'
        USING ERRCODE = 'P0006';
    END IF;
  ELSE
    v_exchange_rate := 1.0;
  END IF;

  -- ── 5. Calcular paid_total ────────────────────────────────────────────────
  v_paid_total := ROUND(v_order.total * v_exchange_rate, 2);

  -- ── 6. UPDATE orders ──────────────────────────────────────────────────────
  UPDATE public.orders o
     SET status                = 'payment_submitted',
         payment_status        = 'submitted',
         payment_method_id     = p_payment_method_id,
         payment_reference     = trim(p_payment_reference),
         payment_proof_url     = COALESCE(NULLIF(trim(p_payment_proof_url), ''), o.payment_proof_url),
         issuer_bank           = v_issuer_bank,
         payment_currency      = v_currency,
         payment_exchange_rate = v_exchange_rate,
         paid_total            = v_paid_total,
         updated_at            = NOW()
   WHERE o.id = p_order_id;

  -- ── 7. UPDATE order_items con precios en moneda de pago ───────────────────
  FOR v_item IN
    SELECT oi.id, oi.unit_price, oi.subtotal
      FROM public.order_items oi
     WHERE oi.order_id = p_order_id
  LOOP
    UPDATE public.order_items oi
       SET paid_unit_price = ROUND(v_item.unit_price * v_exchange_rate, 2),
           paid_subtotal   = ROUND(v_item.subtotal   * v_exchange_rate, 2)
     WHERE oi.id = v_item.id;
  END LOOP;

  RETURN QUERY
    SELECT o.id, o.order_number
      FROM public.orders o
     WHERE o.id = p_order_id;
END;
$$;

COMMENT ON FUNCTION public.submit_order_payment(UUID, UUID, UUID, TEXT, DATE, TEXT, TEXT) IS
  'Registra el reporte de pago: congela moneda y tasa, guarda issuer_bank para métodos VES.';


-- <<< functions/standalone/orders/submit_order_payment.sql


-- >>> functions/standalone/orders/confirm_order_payment.sql

-- @type standalone
-- @entity orders
-- Admin confirma el pago: descuenta stock físico y cierra la reserva.

CREATE OR REPLACE FUNCTION public.confirm_order_payment(
  p_order_id      UUID,
  p_admin_user_id UUID
)
RETURNS TABLE (id UUID, order_number TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_order RECORD;
  v_item  RECORD;
  v_is_admin BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
      FROM public.profiles p
     WHERE p.id = p_admin_user_id
       AND p.is_admin = TRUE
       AND p.deleted_at IS NULL
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'No autorizado'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT o.id, o.status, o.order_number
    INTO v_order
    FROM public.orders o
   WHERE o.id = p_order_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido no encontrado'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_order.status <> 'payment_submitted' THEN
    RAISE EXCEPTION 'Solo se puede confirmar un pedido con pago reportado (estado: %)', v_order.status
      USING ERRCODE = 'P0003';
  END IF;

  FOR v_item IN
    SELECT oi.variant_id, oi.quantity, oi.product_id, oi.subtotal
      FROM public.order_items oi
     WHERE oi.order_id = p_order_id
       AND oi.variant_id IS NOT NULL
  LOOP
    UPDATE public.product_variants pv
       SET reserved_quantity = GREATEST(0, pv.reserved_quantity - v_item.quantity),
           stock_quantity    = GREATEST(0, pv.stock_quantity - v_item.quantity),
           updated_at        = NOW()
     WHERE pv.id = v_item.variant_id;
  END LOOP;

  FOR v_item IN
    SELECT oi.product_id,
           SUM(oi.quantity) AS total_qty,
           SUM(oi.subtotal) AS total_rev
      FROM public.order_items oi
     WHERE oi.order_id = p_order_id
     GROUP BY oi.product_id
  LOOP
    INSERT INTO public.product_stats (product_id, total_sales, total_revenue, updated_at)
    VALUES (v_item.product_id, v_item.total_qty, v_item.total_rev, NOW())
    ON CONFLICT (product_id) DO UPDATE
       SET total_sales   = public.product_stats.total_sales + EXCLUDED.total_sales,
           total_revenue = public.product_stats.total_revenue + EXCLUDED.total_revenue,
           updated_at    = NOW();
  END LOOP;

  UPDATE public.orders o
     SET status         = 'payment_confirmed',
         payment_status = 'confirmed',
         paid_at        = NOW(),
         updated_at     = NOW()
   WHERE o.id = p_order_id;

  RETURN QUERY
    SELECT o.id, o.order_number
      FROM public.orders o
     WHERE o.id = p_order_id;
END;
$$;

COMMENT ON FUNCTION public.confirm_order_payment(UUID, UUID) IS
  'Admin confirma pago reportado: descuenta stock y actualiza product_stats.';


-- <<< functions/standalone/orders/confirm_order_payment.sql


-- >>> functions/standalone/orders/cancel_order.sql

-- @type standalone
-- @entity orders
-- Cancela un pedido y libera reservas de stock si aún no se confirmó el pago.

CREATE OR REPLACE FUNCTION public.cancel_order(
  p_order_id      UUID,
  p_actor_user_id UUID
)
RETURNS TABLE (id UUID, order_number TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_order   RECORD;
  v_item    RECORD;
  v_is_admin BOOLEAN;
BEGIN
  SELECT o.id, o.profile_id, o.status, o.order_number
    INTO v_order
    FROM public.orders o
   WHERE o.id = p_order_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido no encontrado'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT EXISTS (
    SELECT 1
      FROM public.profiles p
     WHERE p.id = p_actor_user_id
       AND p.is_admin = TRUE
       AND p.deleted_at IS NULL
  ) INTO v_is_admin;

  IF v_order.profile_id <> p_actor_user_id AND NOT v_is_admin THEN
    RAISE EXCEPTION 'No tienes acceso a este pedido'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_order.status NOT IN ('pending_payment', 'payment_submitted') THEN
    RAISE EXCEPTION 'Este pedido no se puede cancelar (estado: %)', v_order.status
      USING ERRCODE = 'P0003';
  END IF;

  FOR v_item IN
    SELECT oi.variant_id, oi.quantity
      FROM public.order_items oi
     WHERE oi.order_id = p_order_id
       AND oi.variant_id IS NOT NULL
  LOOP
    UPDATE public.product_variants pv
       SET reserved_quantity = GREATEST(0, pv.reserved_quantity - v_item.quantity),
           updated_at = NOW()
     WHERE pv.id = v_item.variant_id;
  END LOOP;

  UPDATE public.orders o
     SET status         = 'cancelled',
         payment_status = CASE
           WHEN o.payment_status = 'submitted' THEN 'failed'
           ELSE o.payment_status
         END,
         updated_at     = NOW()
   WHERE o.id = p_order_id;

  RETURN QUERY
    SELECT o.id, o.order_number
      FROM public.orders o
     WHERE o.id = p_order_id;
END;
$$;

COMMENT ON FUNCTION public.cancel_order(UUID, UUID) IS
  'Cancela pedido pendiente o con pago reportado y libera reservas de stock.';


-- <<< functions/standalone/orders/cancel_order.sql


-- >>> functions/standalone/orders/expire_pending_orders.sql

-- @type standalone
-- @entity orders
-- Cancela pedidos sin pago reportado que superaron el plazo y libera reservas.

CREATE OR REPLACE FUNCTION public.expire_pending_orders(
  p_hours INTEGER DEFAULT 48
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_item  RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR v_order IN
    SELECT o.id
      FROM public.orders o
     WHERE o.status = 'pending_payment'
       AND o.created_at < NOW() - (p_hours || ' hours')::INTERVAL
     FOR UPDATE
  LOOP
    FOR v_item IN
      SELECT oi.variant_id, oi.quantity
        FROM public.order_items oi
       WHERE oi.order_id = v_order.id
         AND oi.variant_id IS NOT NULL
    LOOP
      UPDATE public.product_variants pv
         SET reserved_quantity = GREATEST(0, pv.reserved_quantity - v_item.quantity),
             updated_at = NOW()
       WHERE pv.id = v_item.variant_id;
    END LOOP;

    UPDATE public.orders o
       SET status = 'cancelled',
           updated_at = NOW()
     WHERE o.id = v_order.id;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION public.expire_pending_orders(INTEGER) IS
  'Cancela pedidos en pending_payment expirados y libera reservas de stock.';


-- <<< functions/standalone/orders/expire_pending_orders.sql


-- >>> tables/reviews.sql

-- ============================================
-- TABLA: reviews
-- Descripción: Reseñas y calificaciones de productos
-- ============================================

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  
  -- Calificación y reseña
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT NOT NULL DEFAULT '',
  comment TEXT NOT NULL DEFAULT '',
  
  -- Moderación
  is_verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Un usuario solo puede hacer una reseña por producto
  UNIQUE(product_id, profile_id)
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_profile_id ON public.reviews(profile_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_is_approved ON public.reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_product_approved ON public.reviews(product_id, is_approved) WHERE is_approved = TRUE;
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver reseñas aprobadas
CREATE POLICY "Anyone can view approved reviews"
  ON public.reviews
  FOR SELECT
  USING (is_approved = TRUE);

-- Los usuarios pueden ver sus propias reseñas (aprobadas o no)
CREATE POLICY "Users can view own reviews"
  ON public.reviews
  FOR SELECT
  USING (auth.uid() = profile_id);

-- Los usuarios pueden crear reseñas solo si han comprado el producto
CREATE POLICY "Users can create reviews for purchased products"
  ON public.reviews
  FOR INSERT
  WITH CHECK (
    auth.uid() = profile_id AND
    EXISTS (
      SELECT 1 FROM public.order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE oi.product_id = reviews.product_id
        AND o.profile_id = auth.uid()
        AND o.status IN ('delivered', 'completed')
    )
  );

-- Los usuarios pueden actualizar sus propias reseñas no aprobadas
CREATE POLICY "Users can update own unapproved reviews"
  ON public.reviews
  FOR UPDATE
  USING (auth.uid() = profile_id AND is_approved = FALSE)
  WITH CHECK (auth.uid() = profile_id);

-- Los usuarios pueden eliminar sus propias reseñas
CREATE POLICY "Users can delete own reviews"
  ON public.reviews
  FOR DELETE
  USING (auth.uid() = profile_id);

-- Admins pueden ver todas las reseñas (aprobadas o no)
CREATE POLICY "Admins can view all reviews"
  ON public.reviews
  FOR SELECT
  USING (is_admin());

-- Admins pueden actualizar reseñas (aprobar/rechazar)
CREATE POLICY "Admins can update reviews"
  ON public.reviews
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admins pueden eliminar reseñas
CREATE POLICY "Admins can delete reviews"
  ON public.reviews
  FOR DELETE
  USING (is_admin());

-- Lógica servidor: docs/server_logic_checklist.md (is_verified_purchase)


-- <<< tables/reviews.sql


-- >>> tables/product_stats.sql

-- ============================================
-- TABLA: product_stats
-- Descripción: Estadísticas agregadas de productos
-- Lógica servidor: docs/server_logic_checklist.md (recalcular stats)
-- ============================================

CREATE TABLE IF NOT EXISTS public.product_stats (
  product_id UUID PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  
  -- Estadísticas de ventas
  total_sales INTEGER NOT NULL DEFAULT 0 CHECK (total_sales >= 0),
  total_revenue DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (total_revenue >= 0),
  
  -- Estadísticas de reseñas
  total_reviews INTEGER NOT NULL DEFAULT 0 CHECK (total_reviews >= 0),
  average_rating DECIMAL(3,2) NOT NULL DEFAULT 0 CHECK (average_rating >= 0),
  
  -- Última actualización
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_product_stats_total_sales ON public.product_stats(total_sales DESC);
CREATE INDEX IF NOT EXISTS idx_product_stats_average_rating ON public.product_stats(average_rating DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.product_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product stats"
  ON public.product_stats
  FOR SELECT
  USING (TRUE);


-- <<< tables/product_stats.sql

