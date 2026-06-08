"use client";

import { PAYMENT_METHODS_BY_TYPE } from "@/constants/payment-methods";
import type { PaymentMethodType } from "@/constants/payment-methods";
import { useToast } from "@/hooks/useToast";
import { trpc } from "@/config/trpc.config";

export const PAYMENT_METHOD_CLOSE_ID = "close-payment-method-dialog";

export function usePaymentMethodFormMutations(handleClose: () => void) {
  const utils = trpc.useUtils();
  const { toast, errorToast } = useToast();

  const onSuccess = async (isUpdate: boolean) => {
    toast({
      title: isUpdate ? "Método de pago actualizado" : "Método de pago creado",
      variant: "success",
    });
    await utils.payment_methods.select.invalidate();
    handleClose();
    document.getElementById(PAYMENT_METHOD_CLOSE_ID)?.click();
  };

  const insertMutation = trpc.payment_methods.insert.useMutation({
    onError: errorToast,
    onSuccess: () => onSuccess(false),
  });

  const updateMutation = trpc.payment_methods.update.useMutation({
    onError: errorToast,
    onSuccess: () => onSuccess(true),
  });

  const submit = async (params: {
    paymentMethod?: PaymentMethod;
    type: PaymentMethodType;
    name: string;
    is_active: boolean;
    payment_details: Record<string, string>;
  }) => {
    const { paymentMethod, type, name, is_active, payment_details } = params;
    const displayName = name.trim() || PAYMENT_METHODS_BY_TYPE[type].name;

    if (paymentMethod) {
      await updateMutation.mutateAsync({
        id: paymentMethod.id,
        name: displayName,
        type,
        payment_details,
        is_active,
      });
    } else {
      await insertMutation.mutateAsync({
        name: displayName,
        type,
        payment_details,
        is_active,
      });
    }
  };

  const isPending = insertMutation.isPending || updateMutation.isPending;

  return { submit, isPending };
}
