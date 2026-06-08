import { z } from "zod";

export const schema = z.object({
  name: z.string().min(1, "El titular es requerido"),
  bank_name: z.string().min(1, "El banco es requerido"),
  account_number: z.string().min(1, "El número de cuenta es requerido"),
  account_type: z.string().optional(),
});

export type BankTransferFormValues = z.infer<typeof schema>;

export const defaultValues: BankTransferFormValues = {
  name: "",
  bank_name: "",
  account_number: "",
  account_type: "",
};

export function getDefaultValuesFromPaymentMethod(paymentMethod: {
  payment_details?: Record<string, string>;
}): BankTransferFormValues {
  const details = paymentMethod.payment_details ?? {};
  return {
    name: details.name ?? "",
    bank_name: details.bank_name ?? "",
    account_number: details.account_number ?? "",
    account_type: details.account_type ?? "",
  };
}
