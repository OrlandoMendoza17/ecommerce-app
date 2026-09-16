"use client";

import { useCallback, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import GuestAddressForm from "../GuestAddressForm/GuestAddressForm";
import {
  GUEST_ADDRESS_FORM_ID,
  type GuestShippingPrefill,
} from "../GuestAddressForm/GuestAddressForm.helpers";

interface GuestAddressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  guestAccessToken: string;
  prefill: GuestShippingPrefill;
  onSaved: () => void;
}

export default function GuestAddressModal({
  open,
  onOpenChange,
  orderId,
  guestAccessToken,
  prefill,
  onSaved,
}: GuestAddressModalProps) {
  const [isPending, setIsPending] = useState(false);

  const handlePendingChange = useCallback((pending: boolean) => {
    setIsPending(pending);
  }, []);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isPending) return;
    onOpenChange(nextOpen);
  };

  const handleSaved = () => {
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={[
          "gap-4 overflow-y-auto overscroll-contain scrollbar-none [&::-webkit-scrollbar]:hidden p-6 sm:max-w-lg",
          "max-h-[calc(100dvh-2rem)]",
          "top-4 left-[50%] -translate-x-1/2 translate-y-0 sm:top-[50%] sm:-translate-y-1/2",
          "max-[424px]:inset-x-0 max-[424px]:top-0 max-[424px]:left-0 max-[424px]:max-h-dvh max-[424px]:w-full max-[424px]:max-w-full max-[424px]:translate-x-0 max-[424px]:translate-y-0 max-[424px]:rounded-none max-[424px]:border-x-0",
        ].join(" ")}
      >
        <DialogHeader>
          <DialogTitle>Dirección de envío</DialogTitle>
          <DialogDescription>
            Completa los datos de entrega para este pedido.
          </DialogDescription>
        </DialogHeader>

        <GuestAddressForm
          orderId={orderId}
          guestAccessToken={guestAccessToken}
          prefill={prefill}
          open={open}
          onSaved={handleSaved}
          onPendingChange={handlePendingChange}
        />

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form={GUEST_ADDRESS_FORM_ID}
            disabled={isPending}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </span>
            ) : (
              "Guardar dirección"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
