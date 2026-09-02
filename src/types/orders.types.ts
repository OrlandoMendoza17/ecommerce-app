type OrderStatus =
  | "pending_payment"
  | "payment_submitted"
  | "payment_confirmed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

type PaymentStatus = "pending" | "submitted" | "confirmed" | "failed";

type ShippingDeliveryMode = "pending" | "address" | "coordinate";

interface Order extends Omit<Tables<"orders">, "status" | "payment_status"> {
  status: OrderStatus;
  payment_status: PaymentStatus;
}

/** Resultado del select en `listMine` (join con order_items). */
interface OrderWithListItems
  extends Pick<
    Order,
    "id" | "order_number" | "status" | "payment_status" | "total" | "created_at"
  > {
  order_items: OrderItemListPreview[] | null;
}

/** Resultado del select en `getById` (join con order_items). */
interface OrderWithItems
  extends Pick<
    Order,
    | "id"
    | "order_number"
    | "status"
    | "payment_status"
    | "subtotal"
    | "total"
    | "created_at"
    | "profile_id"
  > {
  order_items: OrderItemDetailPreview[] | null;
}

/** Pedido mapeado para la lista en "Mis compras". */
interface OrderListItem {
  id: Order["id"];
  order_number: Order["order_number"];
  status: OrderStatus;
  payment_status: PaymentStatus;
  total: number;
  created_at: Order["created_at"];
  item_count: number;
  preview_image: string;
}

/** Línea de pedido en vista de detalle / confirmación. */
interface OrderDetailItem {
  id: OrderItem["id"];
  product_name: OrderItem["product_name"];
  product_image_url: OrderItem["product_image_url"];
  quantity: OrderItem["quantity"];
  unit_price: number;
  subtotal: number;
  /** Precio en la moneda de pago (0 hasta que se reporte el pago). */
  paid_unit_price: number;
  paid_subtotal: number;
  selected_options: Record<string, string>;
}

/** Pedido con ítems para detalle / confirmación. */
interface OrderDetail {
  id: Order["id"];
  order_number: Order["order_number"];
  status: OrderStatus;
  payment_status: PaymentStatus;
  subtotal: number;
  total: number;
  /** Moneda del pago ('USD', 'VES', 'EUR'). DEFAULT 'USD' hasta que se reporte el pago. */
  payment_currency: string;
  /** Tasa de cambio congelada en el momento del reporte de pago. DEFAULT 1.0. */
  payment_exchange_rate: number;
  /** Total en la moneda de pago. DEFAULT 0 hasta que se reporte el pago. */
  paid_total: number;
  created_at: Order["created_at"];
  /** Modo de entrega seleccionado por el cliente. */
  shipping_delivery_mode: ShippingDeliveryMode;
  /** Solo disponible si shipping_delivery_mode === 'address'. */
  shipping_full_name: string;
  shipping_phone: string;
  shipping_address_line1: string;
  shipping_address_line2: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_country: string;
  items: OrderDetailItem[];
}

/** Línea de pedido en vista de rastreo público. */
interface OrderTrackedItem {
  id: OrderItem["id"];
  product_name: OrderItem["product_name"];
  product_image_url: OrderItem["product_image_url"];
  quantity: OrderItem["quantity"];
  subtotal: number;
  paid_subtotal: number;
}

/** Pedido devuelto por `trackByNumber` (rastreo público con email). */
interface OrderTracked {
  id: Order["id"];
  order_number: Order["order_number"];
  status: OrderStatus;
  payment_status: PaymentStatus;
  total: number;
  payment_currency: string;
  payment_exchange_rate: number;
  paid_total: number;
  created_at: Order["created_at"];
  shipping_full_name: string;
  shipping_delivery_mode: ShippingDeliveryMode;
  items: OrderTrackedItem[];
}

/** Respuesta al crear pedido desde el carrito. */
interface OrderCreated {
  id: Order["id"];
  order_number: Order["order_number"];
}

/** Pedido completo para vista admin (modal de detalle). */
interface OrderAdminDetail extends OrderDetail {
  tax: number;
  shipping_cost: number;
  discount: number;
  payment_reference: string;
  payment_proof_url: string;
  issuer_bank: string;
  payment_method: OrderPaymentMethodSummary | null;
  profile: Pick<Profile, "id" | "full_name" | "email" | "phone"> | null;
  items: OrderAdminDetailItem[];
}

/** Método de pago asociado al pedido (join mínimo). */
interface OrderPaymentMethodSummary {
  id: PaymentMethod["id"];
  name: PaymentMethod["name"];
  type: PaymentMethod["type"];
}

/** Línea de pedido en detalle admin. */
interface OrderAdminDetailItem extends OrderDetailItem {
  product_sku: string;
  variant_sku: string;
}

/** Pedido con perfil del cliente (admin / listado). */
interface OrderWithProfile
  extends Pick<
    Order,
    | "id"
    | "order_number"
    | "status"
    | "payment_status"
    | "payment_currency"
    | "subtotal"
    | "paid_total"
    | "shipping_full_name"
    | "shipping_phone"
    | "profile_id"
    | "guest_name"
    | "guest_email"
    | "guest_phone"
    | "created_at"
  > {
  profile: Pick<Profile, "id" | "full_name" | "email" | "phone"> | null;
}
