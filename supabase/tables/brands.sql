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
