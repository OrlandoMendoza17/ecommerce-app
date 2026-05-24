-- ============================================
-- TABLA: cart_items
-- Descripción: Items individuales en el carrito
-- ============================================
-- El precio no se guarda aquí: se lee en vivo desde products.price al mostrar
-- el carrito. El snapshot del precio ocurre al crear order_items.

CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES public.cart(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  
  -- Cantidad
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  
  -- Opciones seleccionadas del producto
  selected_dimension TEXT NOT NULL DEFAULT '', -- Dimensión elegida (ej: "90x40cm")
  selected_thickness TEXT NOT NULL DEFAULT '', -- Grosor elegido (ej: "3mm")
  
  -- Personalización
  customization_text TEXT NOT NULL DEFAULT '',
  customization_notes TEXT NOT NULL DEFAULT '',
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Un producto con las mismas opciones solo puede estar una vez en el carrito
  -- (el mismo producto con diferentes opciones cuenta como items diferentes)
  UNIQUE(cart_id, product_id, selected_dimension, selected_thickness)
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON public.cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON public.cart_items(product_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver items de su propio carrito
CREATE POLICY "Users can view own cart items"
  ON public.cart_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cart 
      WHERE cart.id = cart_items.cart_id 
        AND cart.profile_id = auth.uid()
    )
  );

-- Los usuarios pueden insertar items en su propio carrito
CREATE POLICY "Users can insert own cart items"
  ON public.cart_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cart 
      WHERE cart.id = cart_items.cart_id 
        AND cart.profile_id = auth.uid()
    )
  );

-- Los usuarios pueden actualizar items de su propio carrito
CREATE POLICY "Users can update own cart items"
  ON public.cart_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM cart 
      WHERE cart.id = cart_items.cart_id 
        AND cart.profile_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cart 
      WHERE cart.id = cart_items.cart_id 
        AND cart.profile_id = auth.uid()
    )
  );

-- Los usuarios pueden eliminar items de su propio carrito
CREATE POLICY "Users can delete own cart items"
  ON public.cart_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM cart 
      WHERE cart.id = cart_items.cart_id 
        AND cart.profile_id = auth.uid()
    )
  );
