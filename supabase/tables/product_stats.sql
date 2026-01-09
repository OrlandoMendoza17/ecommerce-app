-- ============================================
-- TABLA: product_stats
-- Descripción: Estadísticas agregadas de productos (vista materializada)
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

-- Todos pueden ver estadísticas de productos
CREATE POLICY "Anyone can view product stats"
  ON public.product_stats
  FOR SELECT
  USING (TRUE);

-- ============================================
-- FUNCIÓN PARA ACTUALIZAR ESTADÍSTICAS
-- ============================================

CREATE OR REPLACE FUNCTION update_product_stats(p_product_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total_sales INTEGER;
  v_total_revenue DECIMAL(12,2);
  v_total_reviews INTEGER;
  v_average_rating DECIMAL(3,2);
BEGIN
  -- Calcular ventas
  SELECT 
    COALESCE(SUM(oi.quantity), 0),
    COALESCE(SUM(oi.subtotal), 0)
  INTO v_total_sales, v_total_revenue
  FROM public.order_items oi
  JOIN orders o ON o.id = oi.order_id
  WHERE oi.product_id = p_product_id
    AND o.status NOT IN ('cancelled', 'refunded');
  
  -- Calcular reseñas
  SELECT 
    COUNT(*),
    COALESCE(AVG(rating), 0)
  INTO v_total_reviews, v_average_rating
  FROM public.reviews
  WHERE product_id = p_product_id
    AND is_approved = TRUE;
  
  -- Insertar o actualizar
  INSERT INTO public.product_stats (
    product_id, 
    total_sales, 
    total_revenue, 
    total_reviews, 
    average_rating,
    updated_at
  ) VALUES (
    p_product_id, 
    v_total_sales, 
    v_total_revenue, 
    v_total_reviews, 
    v_average_rating,
    NOW()
  )
  ON public.CONFLICT (product_id) 
  DO UPDATE SET
    total_sales = v_total_sales,
    total_revenue = v_total_revenue,
    total_reviews = v_total_reviews,
    average_rating = v_average_rating,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS PARA ACTUALIZAR ESTADÍSTICAS
-- ============================================

-- Actualizar cuando se crea/actualiza un order_item
CREATE OR REPLACE FUNCTION trigger_update_product_stats_from_order()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM update_product_stats(OLD.product_id);
  ELSE
    PERFORM update_product_stats(NEW.product_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_order_items_update_stats
  AFTER INSERT OR UPDATE OR DELETE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_product_stats_from_order();

-- Actualizar cuando se crea/actualiza una review
CREATE OR REPLACE FUNCTION trigger_update_product_stats_from_review()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM update_product_stats(OLD.product_id);
  ELSE
    PERFORM update_product_stats(NEW.product_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reviews_update_stats
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_product_stats_from_review();

