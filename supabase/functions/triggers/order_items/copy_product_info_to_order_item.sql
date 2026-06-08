-- @type trigger
-- @entity order_items
-- @table public.order_items
-- @event BEFORE INSERT
-- Snapshot de variante (precio, sku, opciones) o producto padre si no hay variant_id.

CREATE OR REPLACE FUNCTION public.copy_product_info_to_order_item()
RETURNS TRIGGER AS $$
DECLARE
  product_row RECORD;
  variant_row RECORD;
  options_snapshot JSONB;
BEGIN
  IF NEW.variant_id IS NOT NULL THEN
    SELECT
      p.name,
      p.images,
      v.sku AS variant_sku,
      v.price,
      v.images AS variant_images
    INTO variant_row
    FROM public.product_variants v
    JOIN public.products p ON p.id = v.product_id
    WHERE v.id = NEW.variant_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Variante no encontrada: %', NEW.variant_id;
    END IF;

    NEW.unit_price := variant_row.price;

    IF NEW.product_name IS NULL OR NEW.product_name = '' THEN
      NEW.product_name := variant_row.name;
      NEW.product_sku := COALESCE(variant_row.variant_sku, '');
      NEW.variant_sku := COALESCE(variant_row.variant_sku, '');
      NEW.product_image_url := COALESCE(
        variant_row.variant_images->>0,
        variant_row.images->>0,
        ''
      );
    END IF;

    SELECT COALESCE(
      jsonb_object_agg(pot.name, pov.value ORDER BY pot.display_order),
      '{}'::JSONB
    )
    INTO options_snapshot
    FROM public.variant_option_values vov
    JOIN public.product_option_values pov ON pov.id = vov.option_value_id
    JOIN public.product_option_types pot ON pot.id = pov.option_type_id
    WHERE vov.variant_id = NEW.variant_id;

    NEW.selected_options := COALESCE(options_snapshot, '{}'::JSONB);

  ELSE
    SELECT
      name,
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
      NEW.product_sku := '';
      NEW.variant_sku := '';
      NEW.product_image_url := product_row.image_url;
      NEW.selected_options := '{}'::JSONB;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.copy_product_info_to_order_item() IS
  'Trigger: snapshot de variante (precio, sku, opciones JSON) o producto padre si no hay variant_id.';

CREATE TRIGGER trigger_1_copy_product_info
  BEFORE INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.copy_product_info_to_order_item();
