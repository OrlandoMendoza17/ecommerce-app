import { z } from "zod";

export const schema = z.object({
  phone: z.string().min(1, "El teléfono es requerido"),
  cedula: z.string().min(1, "La cédula es requerida"),
  bank_name: z.string().min(1, "El banco es requerido"),
});

export type PagoMovilFormValues = z.infer<typeof schema>;

export const defaultValues: PagoMovilFormValues = {
  phone: "",
  cedula: "",
  bank_name: "",
};

export function getDefaultValuesFromPaymentMethod(paymentMethod: {
  payment_details?: Record<string, string>;
}): PagoMovilFormValues {
  const details = paymentMethod.payment_details ?? {};
  return {
    phone: details.phone ?? "",
    cedula: details.cedula ?? "",
    bank_name: details.bank_name ?? "",
  };
}
