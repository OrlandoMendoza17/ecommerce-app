-- =============================================================================
-- RESET CATÁLOGO + PEDIDOS + CARRITO (conserva profiles y addresses)
-- =============================================================================
-- GENERADO por: npm run build:reset-catalog
-- NO editar manualmente. Modifica supabase/tables/ y vuelve a generar.
--
-- ⚠️  DESTRUCTIVO: borra datos de productos, pedidos, carritos, métodos de pago y reseñas.
--
-- CONSERVA:
--   - public.profiles, public.addresses (y sus datos)
--   - public.is_admin()
--   - Todos los buckets de Storage (no se eliminan; FASE 3 solo actualiza config/RLS)
--   - auth.users (Supabase Auth)
--
-- PREREQUISITOS: profiles + is_admin() ya existen (init_database o equivalente).
--
-- DESPUÉS (opcional):
--   scripts/seed_payment_methods.sql
-- =============================================================================


-- =============================================================================
-- FASE 1 — ELIMINAR (funciones + tablas)
-- =============================================================================

-- Funciones y trigger ligados a tablas que se eliminan
DROP TRIGGER IF EXISTS trigger_1_copy_product_info ON public.order_items;
DROP FUNCTION IF EXISTS public.submit_order_payment(UUID, UUID, UUID, TEXT, DATE, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.copy_product_info_to_order_item();

-- Tablas (orden: hijos primero)
DROP TABLE IF EXISTS public.product_stats CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.cart_items CASCADE;
DROP TABLE IF EXISTS public.cart CASCADE;
DROP TABLE IF EXISTS public.variant_option_values CASCADE;
DROP TABLE IF EXISTS public.product_variants CASCADE;
DROP TABLE IF EXISTS public.product_option_values CASCADE;
DROP TABLE IF EXISTS public.product_option_types CASCADE;
DROP TABLE IF EXISTS public.payment_methods CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.brands CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;


-- =============================================================================
-- FASE 2 — RECREAR TABLAS, RLS, TRIGGERS Y RPC
-- =============================================================================


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

-- >>> tables/brands.sql

-- ============================================
-- TABLA: public.brands
-- Descripción: Marcas de productos
-- ============================================

CREATE TABLE IF NOT EXISTS public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',

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

CREATE INDEX IF NOT EXISTS idx_brands_name ON public.brands(name);
CREATE INDEX IF NOT EXISTS idx_brands_is_active ON public.brands(is_active);
CREATE INDEX IF NOT EXISTS idx_brands_display_order ON public.brands(display_order);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver marcas activas
CREATE POLICY "Anyone can view active brands"
  ON public.brands
  FOR SELECT
  USING (is_active = TRUE);

-- Admins pueden ver todas las marcas (incluso inactivas)
CREATE POLICY "Admins can view all brands"
  ON public.brands
  FOR SELECT
  USING (is_admin());

-- Admins pueden insertar marcas
CREATE POLICY "Admins can insert brands"
  ON public.brands
  FOR INSERT
  WITH CHECK (is_admin());

-- Admins pueden actualizar marcas
CREATE POLICY "Admins can update brands"
  ON public.brands
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admins pueden eliminar marcas
CREATE POLICY "Admins can delete brands"
  ON public.brands
  FOR DELETE
  USING (is_admin());

-- <<< tables/brands.sql

-- >>> tables/products.sql

-- ============================================
-- TABLA: public.products
-- Descripción: Producto padre (catálogo). Precio/stock por variante.
-- ============================================

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,

  -- Información básica
  name TEXT NOT NULL DEFAULT '',
  slug TEXT NOT NULL UNIQUE DEFAULT '',
  description TEXT NOT NULL DEFAULT '',

  -- Resumen de catálogo (derivado de variantes; actualizar al guardar variantes)
  price DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  compare_at_price DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (compare_at_price >= 0),

  -- Atributos de catálogo (no generan SKU)
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
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON public.products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);
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

-- =============================================================================
-- FASE 3 — STORAGE (opcional: upsert buckets + políticas; no elimina buckets)
-- =============================================================================

-- >>> storage/buckets/categories_images.sql

-- ============================================
-- BUCKET: categories_images
-- Tabla: public.categories.image_url
-- Uso: imagen representativa de cada categoría (FormFileInput)
-- Ruta: categories_images/{category_id}/0.{ext}
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'categories_images',
  'categories_images',
  TRUE,
  1048576, -- 1 MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Lectura pública (catálogo / URLs firmadas de larga duración)
DROP POLICY IF EXISTS "Public can view category images" ON storage.objects;
CREATE POLICY "Public can view category images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'categories_images');

-- Solo admins gestionan archivos
DROP POLICY IF EXISTS "Admins can upload category images" ON storage.objects;
CREATE POLICY "Admins can upload category images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'categories_images'
    AND public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can update category images" ON storage.objects;
CREATE POLICY "Admins can update category images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'categories_images'
    AND public.is_admin()
  )
  WITH CHECK (
    bucket_id = 'categories_images'
    AND public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can delete category images" ON storage.objects;
CREATE POLICY "Admins can delete category images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'categories_images'
    AND public.is_admin()
  );

-- <<< storage/buckets/categories_images.sql

-- >>> storage/buckets/brands_images.sql

-- ============================================
-- BUCKET: brands_images
-- Tabla: public.brands.image_url
-- Uso: imagen/logo representativo de cada marca (FormFileInput)
-- Ruta: brands_images/{brand_id}/0.{ext}
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'brands_images',
  'brands_images',
  TRUE,
  1048576, -- 1 MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Lectura pública (catálogo / URLs firmadas de larga duración)
DROP POLICY IF EXISTS "Public can view brand images" ON storage.objects;
CREATE POLICY "Public can view brand images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'brands_images');

-- Solo admins gestionan archivos
DROP POLICY IF EXISTS "Admins can upload brand images" ON storage.objects;
CREATE POLICY "Admins can upload brand images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'brands_images'
    AND public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can update brand images" ON storage.objects;
CREATE POLICY "Admins can update brand images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'brands_images'
    AND public.is_admin()
  )
  WITH CHECK (
    bucket_id = 'brands_images'
    AND public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can delete brand images" ON storage.objects;
CREATE POLICY "Admins can delete brand images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'brands_images'
    AND public.is_admin()
  );

-- <<< storage/buckets/brands_images.sql

-- >>> storage/buckets/products_images.sql

-- ============================================
-- BUCKET: products_images
-- Tabla: public.products.images (JSONB de URLs)
-- Uso: galería de imágenes del producto
-- Ruta: products_images/{product_id}/0.{ext}, 1.{ext}, ...
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products_images',
  'products_images',
  TRUE,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
CREATE POLICY "Public can view product images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'products_images');

DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
CREATE POLICY "Admins can upload product images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'products_images'
    AND public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
CREATE POLICY "Admins can update product images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'products_images'
    AND public.is_admin()
  )
  WITH CHECK (
    bucket_id = 'products_images'
    AND public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
CREATE POLICY "Admins can delete product images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'products_images'
    AND public.is_admin()
  );

-- <<< storage/buckets/products_images.sql

-- >>> storage/buckets/order_payment_proofs.sql

-- ============================================
-- BUCKET: order_payment_proofs
-- Uso: comprobantes de pago de pedidos (cliente)
-- Ruta: order_payment_proofs/{user_id}/{order_id}/0.{ext}
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'order_payment_proofs',
  'order_payment_proofs',
  TRUE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public can view order payment proofs" ON storage.objects;
CREATE POLICY "Public can view order payment proofs"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'order_payment_proofs');

DROP POLICY IF EXISTS "Users can upload own order payment proofs" ON storage.objects;
CREATE POLICY "Users can upload own order payment proofs"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'order_payment_proofs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update own order payment proofs" ON storage.objects;
CREATE POLICY "Users can update own order payment proofs"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'order_payment_proofs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'order_payment_proofs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- <<< storage/buckets/order_payment_proofs.sql


-- =============================================================================
-- FIN — Verifica en Table Editor: categories, products, orders, cart, etc.
-- =============================================================================
