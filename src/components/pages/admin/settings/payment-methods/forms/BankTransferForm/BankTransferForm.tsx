"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import FormInput from "@/components/form/FormInput/FormInput";
import { Form } from "@/components/ui/form";
import useScrollToError from "@/hooks/useScrollToError";
import type { PaymentMethodFormProps } from "../shared/PaymentMethodForm.types";
import { usePaymentMethodFormMutations } from "../shared/usePaymentMethodFormMutations";
import {
  defaultValues,
  getDefaultValuesFromPaymentMethod,
  schema,
  type BankTransferFormValues,
} from "./BankTransferForm.helpers";

export default function BankTransferForm(props: PaymentMethodFormProps) {
  const { formName, handleClose, is_active, name, selectedType, paymentMethod } =
    props;
  const { submit, isPending } = usePaymentMethodFormMutations(handleClose);

  const form = useForm<BankTransferFormValues>({
    resolver: zodResolver(schema),
    defaultValues: paymentMethod
      ? getDefaultValuesFromPaymentMethod(paymentMethod)
      : defaultValues,
  });

  useScrollToError(form.formState.errors);

  const onSubmit = async (data: BankTransferFormValues) => {
    const payment_details: Record<string, string> = {
      name: data.name,
      bank_name: data.bank_name,
      account_number: data.account_number,
    };

    if (data.account_type?.trim()) {
      payment_details.account_type = data.account_type.trim();
    }

    await submit({
      paymentMethod,
      type: selectedType,
      name,
      is_active,
      payment_details,
    });
  };

  return (
    <Form {...form}>
      <form
        id={`form-${formName}`}
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="space-y-4"
      >
        <FormInput
          control={form.control}
          name="name"
          label="Titular de la cuenta"
          placeholder="Nombre completo"
          disabled={isPending}
        />
        <FormInput
          control={form.control}
          name="bank_name"
          label="Banco"
          placeholder="Banco de Venezuela"
          disabled={isPending}
        />
        <FormInput
          control={form.control}
          name="account_number"
          label="Número de cuenta"
          placeholder="0102-1234-5678-9012"
          disabled={isPending}
        />
        <FormInput
          control={form.control}
          name="account_type"
          label="Tipo de cuenta (opcional)"
          placeholder="Corriente, Ahorro..."
          disabled={isPending}
        />
      </form>
    </Form>
  );
}
