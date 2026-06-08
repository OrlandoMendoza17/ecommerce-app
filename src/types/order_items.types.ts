interface OrderItem extends Omit<Tables<"order_items">, "selected_options"> {
  selected_options: Record<string, string>;
}

/** Ítems anidados en listado de pedidos (select parcial). */
type OrderItemListPreview = Pick<OrderItem, "id" | "product_image_url" | "quantity">;

/** Ítems anidados en detalle de pedido (select parcial). */
type OrderItemDetailPreview = Pick<
  OrderItem,
  | "id"
  | "product_name"
  | "product_image_url"
  | "quantity"
  | "unit_price"
  | "subtotal"
  | "selected_options"
>;

/** Ítems en detalle admin (incluye SKU). */
type OrderItemAdminPreview = OrderItemDetailPreview &
  Pick<OrderItem, "product_sku" | "variant_sku">;
