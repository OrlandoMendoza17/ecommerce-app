-- ============================================
-- TABLA: order_items
-- Descripción: Items individuales de cada orden
-- ============================================

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  
  -- Información del producto (desnormalizada para histórico)
  product_name TEXT NOT NULL DEFAULT '',
  product_sku TEXT DEFAULT '',
  product_image_url TEXT DEFAULT '',
  
  -- Detalles del pedido
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
  
  -- Opciones seleccionadas del producto (guardadas para histórico)
  selected_dimension TEXT DEFAULT '', -- Dimensión elegida (ej: "90x40cm")
  selected_thickness TEXT DEFAULT '', -- Grosor elegido (ej: "3mm")
  
  -- Personalización
  customization_text TEXT DEFAULT '',
  customization_notes TEXT DEFAULT '',
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver items de sus propias órdenes
CREATE POLICY "Users can view own order items"
  ON public.order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
        AND orders.profile_id = auth.uid()
    )
  );

-- Los usuarios pueden insertar items en sus propias órdenes
CREATE POLICY "Users can insert own order items"
  ON public.order_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
        AND orders.profile_id = auth.uid()
    )
  );

-- Admins pueden ver todos los order items
CREATE POLICY "Admins can view all order items"
  ON public.order_items
  FOR SELECT
  USING (has_admin_permission('orders'));

-- ============================================
-- TRIGGER PARA CALCULAR SUBTOTAL
-- ============================================

CREATE OR REPLACE FUNCTION calculate_order_item_subtotal()
RETURNS TRIGGER AS $$
BEGIN
  NEW.subtotal := NEW.quantity * NEW.unit_price;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_order_item_subtotal
  BEFORE INSERT OR UPDATE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_order_item_subtotal();

-- ============================================
-- TRIGGER PARA COPIAR INFORMACIÓN DEL PRODUCTO
-- ============================================

CREATE OR REPLACE FUNCTION copy_product_info_to_order_item()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.product_name IS NULL OR NEW.product_name = '' THEN
    SELECT 
      name, 
      sku, 
      COALESCE(images->>0, ''),
      price
    INTO 
      NEW.product_name, 
      NEW.product_sku, 
      NEW.product_image_url,
      NEW.unit_price
    FROM public.products 
    WHERE id = NEW.product_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_copy_product_info
  BEFORE INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION copy_product_info_to_order_item();

