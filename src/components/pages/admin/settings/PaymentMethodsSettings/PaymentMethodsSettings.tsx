"use client";

import { CreditCard, Plus } from "lucide-react";
import PaymentMethodItem from "../PaymentMethodItem/PaymentMethodItem";
import PaymentMethodModal from "../payment-methods/PaymentMethodModal/PaymentMethodModal";
import SettingsSectionCard from "../StoreSettingsSettings/sections/SettingsSectionCard";
import { Button } from "@/components/ui/button";
import { trpc } from "@/config/trpc.config";
import type { PaymentMethodsSettingsProps } from "./PaymentMethodsSettings.types";

function NoPaymentMethods() {
  return (
    <div className="flex flex-col items-center gap-2 py-6 text-center">
      <CreditCard className="text-muted-foreground size-8" />
      <div>
        <p className="text-sm font-medium">No hay métodos de pago configurados</p>
        <p className="text-muted-foreground mt-0.5 text-xs">
          Agrega al menos un método para que los clientes puedan pagar sus pedidos.
        </p>
      </div>
    </div>
  );
}

export default function PaymentMethodsSettings({
  className,
  id = "pagos",
}: PaymentMethodsSettingsProps) {
  const { data: paymentMethods = [], isLoading } =
    trpc.payment_methods.select.useQuery({});

  const noMethods = paymentMethods.length === 0;

  return (
    <SettingsSectionCard
      id={id}
      className={className}
      title="Métodos de pago"
      description="Configura las cuentas y datos que verán los clientes al pagar."
      footer={
        <PaymentMethodModal>
          <Button type="button" size="sm" className="shrink-0">
            <Plus className="size-4" />
            Agregar método
          </Button>
        </PaymentMethodModal>
      }
    >
      <div className="space-y-2">
        {isLoading ? (
          <p className="text-muted-foreground py-4 text-center text-sm">
            Cargando métodos de pago...
          </p>
        ) : null}

        {!isLoading && !noMethods ? (
          <div className="space-y-2">
            {paymentMethods.map((method) => (
              <PaymentMethodItem key={method.id} paymentMethod={method} />
            ))}
          </div>
        ) : null}

        {!isLoading && noMethods ? <NoPaymentMethods /> : null}
      </div>
    </SettingsSectionCard>
  );
}
