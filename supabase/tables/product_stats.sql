-- ============================================
-- TABLA: product_stats
-- Descripción: Estadísticas agregadas de productos
-- Lógica servidor: docs/server_logic_checklist.md (recalcular stats)
-- ============================================

CREATE TABLE IF NOT EXISTS public.product_stats (
  product_id UUID PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  
  -- Estadísticas de ventas
  total_sales INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  
  -- Estadísticas de reseñas
  total_reviews INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  
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
