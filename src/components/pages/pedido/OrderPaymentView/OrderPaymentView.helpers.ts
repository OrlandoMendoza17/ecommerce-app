import { z } from "zod";
import { PAYMENT_METHODS_BY_TYPE } from "@/constants/payment-methods";

export const orderPaymentFormSchema = z.object({
  payment_method_id: z.string().uuid({ message: "Selecciona un método de pago" }),
  issuer_bank: z.string().min(1, { message: "Selecciona el banco emisor" }),
  payment_reference: z
    .string()
    .min(1, { message: "El código de referencia es obligatorio" }),
  payment_date: z
    .string()
    .min(1, { message: "La fecha del pago es obligatoria" }),
  proof_url: z.array(z.instanceof(File)).optional(),
});

export type OrderPaymentFormValues = z.infer<typeof orderPaymentFormSchema>;

export const orderPaymentDefaultValues: OrderPaymentFormValues = {
  payment_method_id: "",
  issuer_bank: "",
  payment_reference: "",
  payment_date: new Date().toISOString().split("T")[0],
  proof_url: [],
};

export function formatOrderAmountUsd(amountUsd: number): string {
  return new Intl.NumberFormat("es-VE", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amountUsd);
}

export function formatOrderAmountVes(amountUsd: number, exchangeRate: number): string {
  return new Intl.NumberFormat("es-VE", {
    style: "currency",
    currency: "VES",
    minimumFractionDigits: 2,
  }).format(amountUsd * exchangeRate);
}

export function getPaymentMethodDisplayName(method: PaymentMethod): string {
  const trimmed = method.name?.trim();
  if (trimmed) return trimmed;
  const typeInfo = PAYMENT_METHODS_BY_TYPE[method.type];
  return typeInfo?.name ?? method.type;
}
