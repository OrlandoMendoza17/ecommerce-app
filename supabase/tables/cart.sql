-- ============================================
-- TABLA: cart
-- Descripción: Carritos de compra de los usuarios
-- ============================================

CREATE TABLE IF NOT EXISTS public.cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL DEFAULT '', -- Vacío si el carrito es de usuario autenticado
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraint: carrito autenticado (profile_id + session_id '') o invitado (session_id con valor)
  CONSTRAINT check_cart_owner CHECK (
    (profile_id IS NOT NULL AND session_id = '') OR
    (profile_id IS NULL AND session_id <> '')
  )
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_cart_profile_id ON public.cart(profile_id);
CREATE INDEX IF NOT EXISTS idx_cart_session_id ON public.cart(session_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_unique_profile ON cart(profile_id) WHERE profile_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_unique_session ON cart(session_id) WHERE session_id <> '';

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver su propio carrito
CREATE POLICY "Users can view own cart"
  ON public.cart
  FOR SELECT
  USING (
    auth.uid() = profile_id OR
    session_id <> '' -- Carrito de invitado (manejar en app level)
  );

-- Los usuarios pueden crear su propio carrito
CREATE POLICY "Users can create own cart"
  ON public.cart
  FOR INSERT
  WITH CHECK (
    auth.uid() = profile_id OR
    session_id <> ''
  );

-- Los usuarios pueden actualizar su propio carrito
CREATE POLICY "Users can update own cart"
  ON public.cart
  FOR UPDATE
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- Los usuarios pueden eliminar su propio carrito
CREATE POLICY "Users can delete own cart"
  ON public.cart
  FOR DELETE
  USING (auth.uid() = profile_id);
