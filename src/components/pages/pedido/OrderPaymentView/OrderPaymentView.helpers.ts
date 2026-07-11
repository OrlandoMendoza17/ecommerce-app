import { z } from "zod";
import {
  formatCurrency,
} from "@/lib/formatters/currency";

export {
  getPaymentMethodCurrency,
  getPaymentMethodDisplayName,
  paymentMethodRequiresIssuerBank,
} from "@/lib/payment-methods";

export const orderPaymentFormSchema = z.object({
  payment_method_id: z.string().uuid({ message: "Selecciona un método de pago" }),
  issuer_bank: z.string().max(120).optional().or(z.literal("")),
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
  return formatCurrency(amountUsd, "USD");
}

/** Formatea el monto del pedido según la moneda del método de pago seleccionado. */
export function formatOrderAmountForMethod(
  amountUsd: number,
  currency: "USD" | "EUR" | "VES",
  exchangeRate: number,
): string {
  if (currency === "USD") return formatOrderAmountUsd(amountUsd);
  return formatCurrency(amountUsd * exchangeRate, currency);
}
