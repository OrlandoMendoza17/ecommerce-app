-- @type standalone
-- @entity orders
-- Cancela pedidos sin pago reportado que superaron el plazo y libera reservas.
-- Retorna JSONB con el detalle de los pedidos cancelados y el stock liberado.

CREATE OR REPLACE FUNCTION public.expire_pending_orders(
  p_hours INTEGER DEFAULT 48
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order        RECORD;
  v_item         RECORD;
  v_count        INTEGER := 0;
  v_orders_json  JSONB   := '[]'::JSONB;
  v_items_json   JSONB;
  v_options_label TEXT;
BEGIN
  FOR v_order IN
    SELECT o.id, o.order_number
      FROM public.orders o
     WHERE o.status = 'pending_payment'
       AND o.created_at < NOW() - (p_hours || ' hours')::INTERVAL
     FOR UPDATE
  LOOP
    v_items_json := '[]'::JSONB;

    FOR v_item IN
      SELECT oi.variant_id, oi.quantity, oi.product_name, oi.selected_options
        FROM public.order_items oi
       WHERE oi.order_id = v_order.id
         AND oi.variant_id IS NOT NULL
    LOOP
      -- Liberar reserva de stock
      UPDATE public.product_variants pv
         SET reserved_quantity = GREATEST(0, pv.reserved_quantity - v_item.quantity),
             updated_at = NOW()
       WHERE pv.id = v_item.variant_id;

      -- Construir etiqueta de opciones desde selected_options JSONB (ej. "Talla: M, Color: Rojo")
      SELECT string_agg(key || ': ' || value, ', ' ORDER BY key)
        INTO v_options_label
        FROM jsonb_each_text(v_item.selected_options);

      v_items_json := v_items_json || jsonb_build_array(
        jsonb_build_object(
          'product_name',  v_item.product_name,
          'options_label', COALESCE(v_options_label, ''),
          'quantity',      v_item.quantity
        )
      );
    END LOOP;

    UPDATE public.orders o
       SET status = 'cancelled',
           updated_at = NOW()
     WHERE o.id = v_order.id;

    v_orders_json := v_orders_json || jsonb_build_array(
      jsonb_build_object(
        'id',           v_order.id,
        'order_number', v_order.order_number,
        'items',        v_items_json
      )
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'cancelled_count', v_count,
    'orders',          v_orders_json
  );
END;
$$;

COMMENT ON FUNCTION public.expire_pending_orders(INTEGER) IS
  'Cancela pedidos en pending_payment expirados y libera reservas de stock. Retorna JSONB con el detalle de cancelaciones.';
