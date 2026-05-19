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
  description TEXT DEFAULT '',
  short_description TEXT DEFAULT '',
  
  -- Especificaciones técnicas para láser
  material TEXT DEFAULT '', -- Tipo de madera (pino, roble, MDF, etc.)
  dimension_options TEXT[] DEFAULT '{}', -- Opciones de dimensiones disponibles (ej: ['90cm', '90x40cm', '120x60cm'])
  thickness_options TEXT[] DEFAULT '{}', -- Opciones de grosor disponibles (ej: ['5.5mm', '3mm', '6mm'])
  
  -- Precios
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0), -- Precio de venta que paga el cliente
  compare_at_price DECIMAL(10,2) CHECK (compare_at_price >= price), -- Precio "antes" para mostrar descuentos (ej: ~~$60.000~~ ahora $45.000)
  cost DECIMAL(10,2), -- Costo de producción (privado, para calcular ganancia/rentabilidad)
  
  -- Inventario
  sku TEXT UNIQUE DEFAULT '', -- Stock Keeping Unit - código único del producto para control de inventario
  stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0), -- Cantidad disponible en inventario (se descuenta al crear órdenes)
  low_stock_threshold INTEGER DEFAULT 5, -- Umbral de alerta cuando el stock está bajo (ej: alerta cuando quedan menos de 5)
  allow_backorder BOOLEAN DEFAULT FALSE, -- Si se puede comprar bajo pedido cuando no hay stock (TRUE: permite comprar sin stock, FALSE: no permite comprar sin stock)
  
  -- Imágenes
  images JSONB DEFAULT '[]'::JSONB, -- Array de URLs de imágenes (ej: ["url1.jpg", "url2.jpg", "url3.jpg"])
  
  -- SEO
  meta_title TEXT DEFAULT '',
  meta_description TEXT DEFAULT '',
  
  -- Estado
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  
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