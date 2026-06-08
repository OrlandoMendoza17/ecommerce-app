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
