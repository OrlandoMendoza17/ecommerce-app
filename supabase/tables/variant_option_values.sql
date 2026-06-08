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
