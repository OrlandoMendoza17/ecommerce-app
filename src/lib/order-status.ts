
const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendiente de pago',
  payment_confirmed: 'Pago confirmado',
  processing: 'En preparación',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
};

export function getOrderStatusLabel(status: OrderStatus): string {
  return STATUS_LABELS[status] ?? status;
}

export function isOrderPendingPayment(status: OrderStatus, paymentStatus: string): boolean {
  return status === 'pending' || paymentStatus === 'pending';
}

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pago pendiente',
  confirmed: 'Confirmado',
  failed: 'Fallido',
};

export function getPaymentStatusLabel(status: PaymentStatus | string): string {
  return PAYMENT_STATUS_LABELS[status as PaymentStatus] ?? status;
}
