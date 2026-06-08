"use client";

import { Building2 } from "lucide-react";
import { PAYMENT_METHODS_BY_TYPE } from "@/constants/payment-methods";
import CopyableField from "@/components/shared/CopyableField/CopyableField";
import { getPaymentMethodFieldLabel } from "@/lib/getPaymentMethodFieldLabel";
import { getPaymentMethodDisplayName } from "./OrderPaymentView.helpers";

interface PaymentMethodDetailsPanelProps {
  paymentMethod: PaymentMethod | null;
}

export default function PaymentMethodDetailsPanel({
  paymentMethod,
}: PaymentMethodDetailsPanelProps) {
  if (!paymentMethod) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg bg-gray-50 px-6 py-12 text-center min-h-[220px]">
        <Building2 className="size-12 text-gray-300" />
        <p className="text-sm text-gray-500">
          Aún no has seleccionado un método de pago
        </p>
      </div>
    );
  }

  const typeInfo = PAYMENT_METHODS_BY_TYPE[paymentMethod.type];
  const displayName = getPaymentMethodDisplayName(paymentMethod);
  const detailEntries = Object.entries(paymentMethod.payment_details ?? {}).filter(
    ([, value]) => value?.trim()
  );

  return (
    <div className="rounded-lg bg-gray-50 p-4 space-y-1 min-h-[220px]">
      <div className="flex items-center gap-3 pb-3 border-b border-gray-200 mb-2">
        {typeInfo?.icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={typeInfo.icon}
            alt={typeInfo.name}
            className="size-10 object-contain"
          />
        ) : (
          <Building2 className="size-10 text-gray-400" />
        )}
        <div>
          <p className="font-semibold text-gray-900">{displayName}</p>
          {typeInfo ? (
            <p className="text-xs text-gray-500">{typeInfo.description}</p>
          ) : null}
        </div>
      </div>

      {detailEntries.length === 0 ? (
        <p className="text-sm text-gray-500 py-4">
          Este método no tiene datos de pago configurados.
        </p>
      ) : (
        detailEntries.map(([key, value]) => (
          <CopyableField
            key={key}
            label={getPaymentMethodFieldLabel(key)}
            value={value}
          />
        ))
      )}
    </div>
  );
}
