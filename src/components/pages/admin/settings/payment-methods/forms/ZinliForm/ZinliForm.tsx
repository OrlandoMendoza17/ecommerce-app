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
  type ZinliFormValues,
} from "./ZinliForm.helpers";

export default function ZinliForm(props: PaymentMethodFormProps) {
  const { formName, handleClose, is_active, name, selectedType, paymentMethod } =
    props;
  const { submit, isPending } = usePaymentMethodFormMutations(handleClose);

  const form = useForm<ZinliFormValues>({
    resolver: zodResolver(schema),
    defaultValues: paymentMethod
      ? getDefaultValuesFromPaymentMethod(paymentMethod)
      : defaultValues,
  });

  useScrollToError(form.formState.errors);

  const onSubmit = async (data: ZinliFormValues) => {
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
          name="name"
          label="Nombre del titular"
          placeholder="Nombre completo"
          disabled={isPending}
        />
        <FormInput
          control={form.control}
          name="email"
          label="Email"
          placeholder="usuario@zinli.com"
          disabled={isPending}
        />
      </form>
    </Form>
  );
}
