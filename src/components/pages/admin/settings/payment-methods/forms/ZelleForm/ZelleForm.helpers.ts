import { z } from "zod";

export const schema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email no válido"),
});

export type ZelleFormValues = z.infer<typeof schema>;

export const defaultValues: ZelleFormValues = {
  name: "",
  email: "",
};

export function getDefaultValuesFromPaymentMethod(paymentMethod: {
  payment_details?: Record<string, string>;
}): ZelleFormValues {
  const details = paymentMethod.payment_details ?? {};
  return {
    name: details.name ?? "",
    email: details.email ?? "",
  };
}
