"use client";

import { Edit, Trash2 } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { PAYMENT_METHODS_BY_TYPE } from "@/constants/payment-methods";
import DeleteEntityModal from "@/components/widgets/DeleteEntityModal/DeleteEntityModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";
import { getPaymentMethodFieldLabel } from "@/lib/getPaymentMethodFieldLabel";
import { getCurrencyDisplayLabel } from "@/lib/formatters/currency";
import { trpc } from "@/config/trpc.config";
import PaymentMethodModal from "../payment-methods/PaymentMethodModal/PaymentMethodModal";
import type { PaymentMethodItemProps } from "./PaymentMethodItem.types";

export default function PaymentMethodItem({
  paymentMethod,
}: PaymentMethodItemProps) {
  const utils = trpc.useUtils();
  const { toast, errorToast } = useToast();

  const typeInfo = PAYMENT_METHODS_BY_TYPE[paymentMethod.type];
  const displayName =
    paymentMethod.name.trim() || typeInfo?.name || paymentMethod.type;

  const { mutateAsync: updatePaymentMethod, isPending: isToggling } =
    trpc.payment_methods.update.useMutation({
      onError: errorToast,
      onSuccess: (data) => {
        toast({
          title: `Método ${data.is_active ? "activado" : "desactivado"}`,
          variant: "success",
        });
        void utils.payment_methods.select.invalidate();
      },
    });

  const handleToggleEnabled = async () => {
    await updatePaymentMethod({
      id: paymentMethod.id,
      is_active: !paymentMethod.is_active,
    });
  };

  const detailPreview = Object.entries(paymentMethod.payment_details ?? {})
    .filter(([, value]) => value)
    .slice(0, 2)
    .map(([key, value]) => `${getPaymentMethodFieldLabel(key)}: ${value}`)
    .join(" · ");

  return (
    <div
      className={twMerge(
        "flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between",
        !paymentMethod.is_active && "opacity-70"
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {typeInfo?.icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={typeInfo.icon}
            alt={typeInfo.name}
            className="size-10 shrink-0 rounded-md object-contain"
          />
        ) : null}
        <div className="min-w-0">
          <p className="truncate font-medium">{displayName}</p>
          <p className="text-muted-foreground truncate text-sm">
            {typeInfo?.name}
            {typeInfo?.currency ? ` · ${getCurrencyDisplayLabel(typeInfo.currency)}` : ""}
          </p>
          {detailPreview ? (
            <p className="text-muted-foreground mt-1 truncate text-xs">
              {detailPreview}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
        <Badge
          variant={paymentMethod.is_active ? "default" : "secondary"}
          className="cursor-pointer select-none"
          onClick={() => {
            if (!isToggling) void handleToggleEnabled();
          }}
        >
          {paymentMethod.is_active ? "Activo" : "Inactivo"}
        </Badge>

        <PaymentMethodModal paymentMethod={paymentMethod}>
          <Button type="button" variant="ghost" size="icon" aria-label="Editar">
            <Edit className="size-4" />
          </Button>
        </PaymentMethodModal>

        <DeleteEntityModal
          entity="Método de pago"
          name={displayName}
          id={paymentMethod.id}
          mutation={trpc.payment_methods.delete}
          onDeleteSuccess={() => {
            void utils.payment_methods.select.invalidate();
          }}
        >
          <Button type="button" variant="ghost" size="icon" aria-label="Eliminar">
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </DeleteEntityModal>
      </div>
    </div>
  );
}
