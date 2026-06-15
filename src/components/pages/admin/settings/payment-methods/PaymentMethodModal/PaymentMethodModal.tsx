"use client";

import { useEffect, useState } from "react";
import { useIsMutating } from "@tanstack/react-query";
import { twMerge } from "tailwind-merge";
import {
  PAYMENT_METHODS_BASE_INFO,
  type PaymentMethodType,
} from "@/constants/payment-methods";
import { getCurrencyDisplayLabel } from "@/lib/formatters/currency";
import DialogContent from "@/components/widgets/DialogContent/DialogContent";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import BankTransferForm from "../forms/BankTransferForm/BankTransferForm";
import BinanceForm from "../forms/BinanceForm/BinanceForm";
import PagoMovilForm from "../forms/PagoMovilForm/PagoMovilForm";
import { PAYMENT_METHOD_CLOSE_ID } from "../forms/shared/usePaymentMethodFormMutations";
import ZelleForm from "../forms/ZelleForm/ZelleForm";
import ZinliForm from "../forms/ZinliForm/ZinliForm";
import type { PaymentMethodModalProps } from "./PaymentMethodModal.types";

const formName = "payment-method";

export default function PaymentMethodModal({
  className,
  children,
  paymentMethod,
}: PaymentMethodModalProps) {
  const isEditing = !!paymentMethod;
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<PaymentMethodType | null>(
    paymentMethod?.type ?? null
  );
  const [isActive, setIsActive] = useState(paymentMethod?.is_active ?? true);
  const [name, setName] = useState(paymentMethod?.name ?? "");
  const mutating = useIsMutating();

  useEffect(() => {
    if (!open) return;
    setSelectedType(paymentMethod?.type ?? null);
    setIsActive(paymentMethod?.is_active ?? true);
    setName(paymentMethod?.name ?? "");
  }, [open, paymentMethod]);

  const handleClose = () => {
    setOpen(false);
  };

  const selectedInfo = selectedType
    ? PAYMENT_METHODS_BASE_INFO.find((m) => m.id === selectedType)
    : undefined;

  const formProps = {
    formName,
    handleClose,
    is_active: isActive,
    name,
    paymentMethod,
    selectedType: selectedType!,
  };

  const renderForm = () => {
    if (!selectedType) return null;

    switch (selectedType) {
      case "pago_movil":
        return <PagoMovilForm {...formProps} />;
      case "zinli":
        return <ZinliForm {...formProps} />;
      case "zelle":
        return <ZelleForm {...formProps} />;
      case "binance":
        return <BinanceForm {...formProps} />;
      case "transferencia_bancaria":
        return <BankTransferForm {...formProps} />;
      default:
        return null;
    }
  };

  const title = isEditing ? "Editar método de pago" : "Agregar método de pago";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}

      <DialogContent
        className={twMerge("PaymentMethodModal sm:max-w-[520px]", className)}
        closeId={PAYMENT_METHOD_CLOSE_ID}
        onClose={handleClose}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Configura los datos que verán los clientes al realizar un pago.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="payment-method-type">Tipo de método</Label>
            <Select
              value={selectedType ?? undefined}
              onValueChange={(value) =>
                setSelectedType(value as PaymentMethodType)
              }
              disabled={isEditing}
            >
              <SelectTrigger id="payment-method-type">
                <SelectValue placeholder="Selecciona un tipo" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS_BASE_INFO.map((method) => (
                  <SelectItem key={method.id} value={method.id}>
                    {method.name} ({getCurrencyDisplayLabel(method.currency)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedInfo ? (
              <p className="text-muted-foreground text-sm">
                {selectedInfo.description}
              </p>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="payment-method-active">Activo</Label>
              <p className="text-muted-foreground text-sm">
                Los clientes solo ven métodos activos al pagar.
              </p>
            </div>
            <Switch
              id="payment-method-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-method-name">Etiqueta (opcional)</Label>
            <Input
              id="payment-method-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Pago Móvil principal"
            />
          </div>

          {renderForm()}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form={`form-${formName}`}
            disabled={!selectedType || !!mutating}
          >
            {isEditing ? "Guardar cambios" : "Agregar método de pago"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
