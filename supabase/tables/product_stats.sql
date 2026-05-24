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
