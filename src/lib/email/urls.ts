function appBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

export function orderUrl(orderId: string): string {
  return `${appBaseUrl()}/pedido/${orderId}`;
}

export function orderPaymentUrl(orderId: string): string {
  return `${appBaseUrl()}/pedido/${orderId}/pago`;
}

export function orderConfirmationUrl(orderId: string): string {
  return `${appBaseUrl()}/pedido/${orderId}/confirmacion`;
}

export function adminOrderUrl(orderId: string): string {
  return `${appBaseUrl()}/admin/orders/${orderId}`;
}

export function adminOrdersUrl(): string {
  return `${appBaseUrl()}/admin/orders`;
}
