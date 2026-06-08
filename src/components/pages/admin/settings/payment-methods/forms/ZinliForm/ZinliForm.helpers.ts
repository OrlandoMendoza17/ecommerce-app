import { z } from "zod";

export const schema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email no válido"),
});

export type ZinliFormValues = z.infer<typeof schema>;

export const defaultValues: ZinliFormValues = {
  name: "",
  email: "",
};

export function getDefaultValuesFromPaymentMethod(paymentMethod: {
  payment_details?: Record<string, string>;
}): ZinliFormValues {
  const details = paymentMethod.payment_details ?? {};
  return {
    name: details.name ?? "",
    email: details.email ?? "",
  };
}
