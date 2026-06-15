import {
  PAYMENT_METHODS_BY_TYPE,
  type PaymentMethodType,
} from "@/constants/payment-methods";

/** Subconjunto mínimo de payment_methods para mostrar en vistas de pedido. */
export interface PaymentMethodSummary {
  id: string;
  name: string;
  type: PaymentMethodType;
}

export function getPaymentMethodDisplayName(
  method: Pick<PaymentMethodSummary, "name" | "type">,
): string {
  const trimmed = method.name?.trim();
  if (trimmed) return trimmed;
  const typeInfo = PAYMENT_METHODS_BY_TYPE[method.type];
  return typeInfo?.name ?? method.type;
}

export function getPaymentMethodCurrency(
  method: Pick<PaymentMethodSummary, "type"> | null,
): "USD" | "EUR" | "VES" {
  if (!method) return "USD";
  return PAYMENT_METHODS_BY_TYPE[method.type]?.currency ?? "USD";
}

/** Métodos que requieren banco emisor al reportar el pago. */
export function paymentMethodRequiresIssuerBank(
  type: PaymentMethodType,
): boolean {
  return type === "pago_movil" || type === "transferencia_bancaria";
}
