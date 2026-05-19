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
  title TEXT DEFAULT '',
  comment TEXT DEFAULT '',
  
  -- Moderación
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  
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
