-- ============================================
-- TABLA: cart_items
-- Descripción: Items individuales en el carrito
-- ============================================

CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES public.cart(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  
  -- Cantidad
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  
  -- Precio al momento de agregar (para mantener consistencia)
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  
  -- Opciones seleccionadas del producto
  selected_dimension TEXT DEFAULT '', -- Dimensión elegida (ej: "90x40cm")
  selected_thickness TEXT DEFAULT '', -- Grosor elegido (ej: "3mm")
  
  -- Personalización
  customization_text TEXT DEFAULT '',
  customization_notes TEXT DEFAULT '',
  
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

-- ============================================
-- TRIGGER PARA UPDATED_AT
-- ============================================

CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TRIGGER PARA ACTUALIZAR PRECIO AUTOMÁTICO
-- ============================================

CREATE OR REPLACE FUNCTION set_cart_item_price()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.unit_price IS NULL OR NEW.unit_price = 0 THEN
    SELECT price INTO NEW.unit_price 
    FROM public.products 
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_cart_item_price
  BEFORE INSERT ON public.cart_items
  FOR EACH ROW
  EXECUTE FUNCTION set_cart_item_price();

