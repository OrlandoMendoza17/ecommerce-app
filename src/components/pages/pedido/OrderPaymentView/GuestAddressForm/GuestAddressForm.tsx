"use client";

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import FormInput from "@/components/form/FormInput/FormInput";
import { trpc } from "@/config/trpc.config";
import { useToast } from "@/hooks/useToast";
import {
  GUEST_ADDRESS_FORM_ID,
  guestAddressSchema,
  prefillToFormValues,
  type GuestAddressFormValues,
  type GuestShippingPrefill,
} from "./GuestAddressForm.helpers";

interface GuestAddressFormProps {
  orderId: string;
  guestAccessToken: string;
  prefill: GuestShippingPrefill;
  open: boolean;
  onSaved: () => void;
  onPendingChange: (pending: boolean) => void;
}

export default function GuestAddressForm({
  orderId,
  guestAccessToken,
  prefill,
  open,
  onSaved,
  onPendingChange,
}: GuestAddressFormProps) {
  const { errorToast } = useToast();
  const utils = trpc.useUtils();

  const form = useForm<GuestAddressFormValues>({
    resolver: zodResolver(guestAddressSchema),
    defaultValues: prefillToFormValues(prefill),
  });

  const { control, handleSubmit, reset } = form;

  const prefillRef = useRef(prefill);
  prefillRef.current = prefill;

  const setShippingMutation = trpc.orders.setShipping.useMutation({
    onSuccess: () => {
      utils.orders.getById.invalidate({ id: orderId });
    },
    onError: errorToast,
  });

  const isPending = setShippingMutation.isPending;

  useEffect(() => {
    onPendingChange(isPending);
  }, [isPending, onPendingChange]);

  useEffect(() => {
    if (!open) return;
    reset(prefillToFormValues(prefillRef.current));
  }, [open, reset]);

  const onSubmit = handleSubmit(async (data) => {
    await setShippingMutation.mutateAsync({
      id: orderId,
      mode: "address",
      guest_access_token: guestAccessToken,
      full_name: data.full_name.trim(),
      phone: data.phone.trim(),
      address_line1: data.address_line1.trim(),
      address_line2: data.address_line2?.trim() ?? "",
      city: data.city.trim(),
      state: data.state.trim(),
      postal_code: data.postal_code?.trim() ?? "",
      country: data.country?.trim() || "Venezuela",
    });
    onSaved();
  });

  return (
    <Form {...form}>
      <form
        id={GUEST_ADDRESS_FORM_ID}
        className="space-y-4 py-1"
        onSubmit={onSubmit}
        noValidate
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInput
            control={control}
            name="full_name"
            label="Nombre completo"
            placeholder="Juan Pérez"
            wrapperClassName="sm:col-span-2"
            disabled={isPending}
          />

          <FormInput
            control={control}
            name="phone"
            label="Teléfono"
            placeholder="+58 412-1234567"
            type="tel"
            disabled={isPending}
          />

          <FormInput
            control={control}
            name="country"
            label="País"
            placeholder="Venezuela"
            disabled={isPending}
          />

          <FormInput
            control={control}
            name="address_line1"
            label="Dirección"
            placeholder="Av. Principal, Casa 12"
            wrapperClassName="sm:col-span-2"
            disabled={isPending}
          />

          <FormInput
            control={control}
            name="address_line2"
            label="Dirección (línea 2)"
            placeholder="Urb. El Bosque, Piso 3"
            description="Opcional"
            wrapperClassName="sm:col-span-2"
            disabled={isPending}
          />

          <FormInput
            control={control}
            name="city"
            label="Ciudad"
            placeholder="Caracas"
            disabled={isPending}
          />

          <FormInput
            control={control}
            name="state"
            label="Estado"
            placeholder="Distrito Capital"
            disabled={isPending}
          />

          <FormInput
            control={control}
            name="postal_code"
            label="Código postal"
            placeholder="1060"
            description="Opcional"
            disabled={isPending}
          />
        </div>
      </form>
    </Form>
  );
}
