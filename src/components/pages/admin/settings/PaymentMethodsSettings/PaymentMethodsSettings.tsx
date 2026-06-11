"use client";

import { CreditCard, Plus } from "lucide-react";
import { twMerge } from "tailwind-merge";
import PaymentMethodItem from "../PaymentMethodItem/PaymentMethodItem";
import PaymentMethodModal from "../payment-methods/PaymentMethodModal/PaymentMethodModal";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/config/trpc.config";
import type { PaymentMethodsSettingsProps } from "./PaymentMethodsSettings.types";

function NoPaymentMethods() {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <CreditCard className="text-muted-foreground size-10" />
      <div>
        <p className="font-medium">No hay métodos de pago configurados</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Agrega al menos un método para que los clientes puedan pagar sus
          pedidos.
        </p>
      </div>
    </div>
  );
}

export default function PaymentMethodsSettings({
  className,
  id,
}: PaymentMethodsSettingsProps) {
  const { data: paymentMethods = [], isLoading } =
    trpc.payment_methods.select.useQuery({});

  const noMethods = paymentMethods.length === 0;

  return (
    <Card id={id} className={twMerge("PaymentMethodsSettings", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Métodos de pago</CardTitle>
          <CardDescription className="mt-1.5">
            Configura las cuentas y datos que verán los clientes al pagar.
          </CardDescription>
        </div>
        <PaymentMethodModal>
          <Button type="button" size="sm" className="shrink-0">
            <Plus className="size-4" />
            Agregar método
          </Button>
        </PaymentMethodModal>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            Cargando métodos de pago...
          </p>
        ) : null}

        {!isLoading && !noMethods ? (
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <PaymentMethodItem key={method.id} paymentMethod={method} />
            ))}
          </div>
        ) : null}

        {!isLoading && noMethods ? <NoPaymentMethods /> : null}

        <Separator />

        <p className="text-muted-foreground text-sm">
          Solo los métodos marcados como activos aparecerán en el flujo de pago
          del cliente. Puedes tener varios métodos del mismo tipo con distintas
          cuentas o datos.
        </p>
      </CardContent>
    </Card>
  );
}
