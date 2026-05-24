-- =============================================================================
-- INIT DATABASE — E-commerce (impresiones en madera)
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
--  5. cart              → profiles
--  6. cart_items        → cart, products
--  7. payment_methods
--  8. orders            → profiles, payment_methods
--  9. order_items       → orders, products + trigger copy_product_info_to_order_item
-- 10. reviews           → products, profiles, orders
-- 11. product_stats     → products
-- ─────────────────────────────────────────────────────────────────────────────
--
-- En DB quedan: is_admin() · trigger copy_product_info_to_order_item
-- Lógica en servidor (checklist): scripts/server_logic_checklist.md
--
-- Después (opcional):
--   scripts/seed_admin.sql
--   scripts/seed_payment_methods.sql
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
-- Descripción: Productos (impresiones en madera)
-- ============================================

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  
  -- Información básica
  name TEXT NOT NULL DEFAULT '',
  slug TEXT NOT NULL UNIQUE DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  short_description TEXT NOT NULL DEFAULT '',
  
  -- Especificaciones técnicas para láser
  material TEXT NOT NULL DEFAULT '', -- Tipo de madera (pino, roble, MDF, etc.)
  
  -- Precios
  price DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0), -- Precio de venta que paga el cliente
  compare_at_price DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (compare_at_price >= price), -- Precio "antes" para mostrar descuentos
  cost DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (cost >= 0), -- Costo de producción (privado)
  
  -- Inventario
  sku TEXT NOT NULL UNIQUE DEFAULT '', -- Stock Keeping Unit - código único del producto para control de inventario
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0), -- Cantidad disponible en inventario
  low_stock_threshold INTEGER NOT NULL DEFAULT 0 CHECK (low_stock_threshold >= 0), -- Umbral de alerta de stock bajo
  allow_backorder BOOLEAN NOT NULL DEFAULT FALSE, -- Si se puede comprar bajo pedido cuando no hay stock
  
  -- Imágenes
  images JSONB NOT NULL DEFAULT '[]'::JSONB, -- Array de URLs de imágenes (ej: ["url1.jpg", "url2.jpg", "url3.jpg"])
  
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
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);
CREATE INDEX IF NOT EXISTS idx_products_stock ON public.products(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

-- Índice compuesto para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_products_active_category ON public.products(is_active, category_id) WHERE is_active = TRUE;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver productos activos
CREATE POLICY "Anyone can view active products"
  ON public.products
  FOR SELECT
  USING (is_active = TRUE);

-- Admins pueden ver todos los productos (incluso inactivos)
CREATE POLICY "Admins can view all products"
  ON public.products
  FOR SELECT
  USING (is_admin());

-- Admins pueden insertar productos
CREATE POLICY "Admins can insert products"
  ON public.products
  FOR INSERT
  WITH CHECK (is_admin());

-- Admins pueden actualizar productos
CREATE POLICY "Admins can update products"
  ON public.products
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admins pueden eliminar productos
CREATE POLICY "Admins can delete products"
  ON public.products
  FOR DELETE
  USING (is_admin());


-- <<< tables/products.sql


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
-- El precio no se guarda aquí: se lee en vivo desde products.price al mostrar
-- el carrito. El snapshot del precio ocurre al crear order_items.

CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES public.cart(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  
  -- Cantidad
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  
  -- Opciones seleccionadas del producto
  selected_dimension TEXT NOT NULL DEFAULT '', -- Dimensión elegida (ej: "90x40cm")
  selected_thickness TEXT NOT NULL DEFAULT '', -- Grosor elegido (ej: "3mm")
  
  -- Personalización
  customization_text TEXT NOT NULL DEFAULT '',
  customization_notes TEXT NOT NULL DEFAULT '',
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Un producto con las mismas opciones solo puede estar una vez en el carrito
  -- (el mismo producto con diferentes opciones cuenta como items diferentes)
  UNIQUE(cart_id, product_id, selected_dimension, selected_thickness)
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON public.cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON public.cart_items(product_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver items de su propio carrito
CREATE POLICY "Users can view own cart items"
  ON public.cart_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cart 
      WHERE cart.id = cart_items.cart_id 
        AND cart.profile_id = auth.uid()
    )
  );

-- Los usuarios pueden insertar items en su propio carrito
CREATE POLICY "Users can insert own cart items"
  ON public.cart_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cart 
      WHERE cart.id = cart_items.cart_id 
        AND cart.profile_id = auth.uid()
    )
  );

-- Los usuarios pueden actualizar items de su propio carrito
CREATE POLICY "Users can update own cart items"
  ON public.cart_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM cart 
      WHERE cart.id = cart_items.cart_id 
        AND cart.profile_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cart 
      WHERE cart.id = cart_items.cart_id 
        AND cart.profile_id = auth.uid()
    )
  );

-- Los usuarios pueden eliminar items de su propio carrito
CREATE POLICY "Users can delete own cart items"
  ON public.cart_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM cart 
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
  
  -- Estado
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'payment_confirmed',
    'processing',
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
  payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL, -- Método de pago seleccionado
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'confirmed', 'failed')),
  payment_reference TEXT NOT NULL DEFAULT '', -- Número de referencia/transacción del pago
  payment_proof_url TEXT NOT NULL DEFAULT '', -- URL de la captura del comprobante de pago (Supabase Storage)
  paid_at TIMESTAMPTZ,
  
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

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver sus propias órdenes
CREATE POLICY "Users can view own orders"
  ON public.orders
  FOR SELECT
  USING (auth.uid() = profile_id);

-- Los usuarios pueden crear órdenes
CREATE POLICY "Users can create orders"
  ON public.orders
  FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

-- Admins pueden ver todas las órdenes
CREATE POLICY "Admins can view all orders"
  ON public.orders
  FOR SELECT
  USING (is_admin());

-- Admins pueden actualizar órdenes (cambiar estado, tracking, etc.)
CREATE POLICY "Admins can update orders"
  ON public.orders
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

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
  
  -- Información del producto (desnormalizada para histórico)
  product_name TEXT NOT NULL DEFAULT '',
  product_sku TEXT NOT NULL DEFAULT '',
  product_image_url TEXT NOT NULL DEFAULT '',
  
  -- Detalles del pedido
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  
  -- Opciones seleccionadas del producto (guardadas para histórico)
  selected_dimension TEXT NOT NULL DEFAULT '', -- Dimensión elegida (ej: "90x40cm")
  selected_thickness TEXT NOT NULL DEFAULT '', -- Grosor elegido (ej: "3mm")
  
  -- Personalización
  customization_text TEXT NOT NULL DEFAULT '',
  customization_notes TEXT NOT NULL DEFAULT '',
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver items de sus propias órdenes
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

-- Los usuarios pueden insertar items en sus propias órdenes
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

-- Admins pueden ver todos los order items
CREATE POLICY "Admins can view all order items"
  ON public.order_items
  FOR SELECT
  USING (is_admin());

-- Trigger DB: functions/triggers/order_items/copy_product_info_to_order_item.sql
-- Lógica servidor: docs/server_logic_checklist.md (subtotal, totales)


-- <<< tables/order_items.sql


-- >>> functions/triggers/order_items/copy_product_info_to_order_item.sql

-- @type trigger
-- @entity order_items
-- @table public.order_items
-- @event BEFORE INSERT
-- Snapshot de products.price y metadatos al confirmar pedido (ejecutar antes del subtotal).

CREATE OR REPLACE FUNCTION public.copy_product_info_to_order_item()
RETURNS TRIGGER AS $$
DECLARE
  product_row RECORD;
BEGIN
  SELECT
    name,
    sku,
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
    NEW.product_sku := product_row.sku;
    NEW.product_image_url := product_row.image_url;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.copy_product_info_to_order_item() IS
  'Trigger: snapshot de price y metadatos del producto al insertar línea de pedido.';

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

