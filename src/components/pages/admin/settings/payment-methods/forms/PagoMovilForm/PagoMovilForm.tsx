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
  type PagoMovilFormValues,
} from "./PagoMovilForm.helpers";

export default function PagoMovilForm(props: PaymentMethodFormProps) {
  const { formName, handleClose, is_active, name, selectedType, paymentMethod } =
    props;
  const { submit, isPending } = usePaymentMethodFormMutations(handleClose);

  const form = useForm<PagoMovilFormValues>({
    resolver: zodResolver(schema),
    defaultValues: paymentMethod
      ? getDefaultValuesFromPaymentMethod(paymentMethod)
      : defaultValues,
  });

  useScrollToError(form.formState.errors);

  const onSubmit = async (data: PagoMovilFormValues) => {
    await submit({
      paymentMethod,
      type: selectedType,
      name,
      is_active,
      payment_details: data,
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
          name="phone"
          label="Teléfono"
          placeholder="0424-1234567"
          disabled={isPending}
        />
        <FormInput
          control={form.control}
          name="cedula"
          label="Cédula"
          placeholder="V-12345678"
          disabled={isPending}
        />
        <FormInput
          control={form.control}
          name="bank_name"
          label="Banco"
          placeholder="Banco de Venezuela"
          disabled={isPending}
        />
      </form>
    </Form>
  );
}
