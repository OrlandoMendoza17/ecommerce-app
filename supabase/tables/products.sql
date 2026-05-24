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