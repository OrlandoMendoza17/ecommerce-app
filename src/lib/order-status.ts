
const STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: 'Pago pendiente',
  payment_submitted: 'Pago reportado',
  payment_confirmed: 'Pago confirmado',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
};

export function getOrderStatusLabel(status: OrderStatus): string {
  return STATUS_LABELS[status] ?? status;
}

/** El cliente aún puede reportar o completar el pago. */
export function isOrderPendingPayment(status: OrderStatus): boolean {
  return status === 'pending_payment';
}

/** Esperando confirmación del admin tras reporte de pago. */
export function isOrderAwaitingConfirmation(status: OrderStatus): boolean {
  return status === 'payment_submitted';
}

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pago pendiente',
  submitted: 'Pago reportado',
  confirmed: 'Confirmado',
  failed: 'Rechazado',
};

export function getPaymentStatusLabel(status: PaymentStatus | string): string {
  return PAYMENT_STATUS_LABELS[status as PaymentStatus] ?? status;
}
