import { z } from "zod";

export const schema = z.object({
  email: z.string().email("Email no válido"),
  wallet_address: z.string().min(1, "La dirección de billetera es requerida"),
});

export type BinanceFormValues = z.infer<typeof schema>;

export const defaultValues: BinanceFormValues = {
  email: "",
  wallet_address: "",
};

export function getDefaultValuesFromPaymentMethod(paymentMethod: {
  payment_details?: Record<string, string>;
}): BinanceFormValues {
  const details = paymentMethod.payment_details ?? {};
  return {
    email: details.email ?? "",
    wallet_address: details.wallet_address ?? "",
  };
}
