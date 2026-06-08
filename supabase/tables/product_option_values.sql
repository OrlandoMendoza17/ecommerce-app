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
