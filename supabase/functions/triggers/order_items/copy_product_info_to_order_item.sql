-- @type trigger
-- @entity order_items
-- @table public.order_items
-- @event BEFORE INSERT
-- Snapshot de products.price y metadatos al confirmar pedido (ejecutar antes del subtotal).

CREATE OR REPLACE FUNCTION public.copy_product_info_to_order_item()
RETURNS TRIGGER AS $$
DECLARE
  product_row RECORD;
BEGIN
  SELECT
    name,
    sku,
    COALESCE(images->>0, '') AS image_url,
    price
  INTO product_row
  FROM public.products
  WHERE id = NEW.product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Producto no encontrado: %', NEW.product_id;
  END IF;

  NEW.unit_price := product_row.price;

  IF NEW.product_name IS NULL OR NEW.product_name = '' THEN
    NEW.product_name := product_row.name;
    NEW.product_sku := product_row.sku;
    NEW.product_image_url := product_row.image_url;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.copy_product_info_to_order_item() IS
  'Trigger: snapshot de price y metadatos del producto al insertar línea de pedido.';

CREATE TRIGGER trigger_1_copy_product_info
  BEFORE INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.copy_product_info_to_order_item();
