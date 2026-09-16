"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { trpc } from "@/config/trpc.config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/useToast";

interface OrderDetailActionsProps {
  orderId: string;
  status: OrderStatus;
  paidAmountLabel?: string;
  onUpdated: () => void;
}

function RefundButton({
  orderId,
  paidAmountLabel,
  disabled,
  onRefunded,
}: {
  orderId: string;
  paidAmountLabel?: string;
  disabled: boolean;
  onRefunded: () => Promise<void>;
}) {
  const { toast, errorToast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  const refundMutation = trpc.orders.refundOrder.useMutation({
    onError: errorToast,
    onSuccess: async () => {
      await onRefunded();
      setOpen(false);
      setReason("");
      toast({
        title: "Pedido reembolsado",
        description: "Se restauró el stock. El dinero se devolvió fuera de la app.",
        variant: "success",
      });
    },
  });

  return (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={disabled || refundMutation.isPending}
        onClick={() => setOpen(true)}
      >
        Reembolsar
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reembolsar pedido</DialogTitle>
            <DialogDescription>
              Confirma que ya devolviste el dinero fuera de la app
              {paidAmountLabel ? ` (${paidAmountLabel})` : ""}. El stock de las
              variantes volverá al inventario. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="refund-reason">Motivo (opcional)</Label>
            <Textarea
              id="refund-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              placeholder="Ej. producto defectuoso, cliente desistió…"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={refundMutation.isPending}
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={refundMutation.isPending}
              onClick={() =>
                refundMutation.mutate({
                  id: orderId,
                  reason: reason.trim() || undefined,
                })
              }
            >
              {refundMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Confirmar reembolso"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function OrderDetailActions({
  orderId,
  status,
  paidAmountLabel,
  onUpdated,
}: OrderDetailActionsProps) {
  const { toast, errorToast } = useToast();
  const utils = trpc.useUtils();
  const [trackingNumber, setTrackingNumber] = useState("");

  const invalidate = async () => {
    await utils.orders.getByIdAdmin.invalidate({ id: orderId });
    await utils.orders.selectByRange.invalidate();
    onUpdated();
  };

  const confirmMutation = trpc.orders.confirmPayment.useMutation({
    onError: errorToast,
    onSuccess: async () => {
      await invalidate();
      toast({
        title: "Pago confirmado",
        description: "El stock fue descontado y el pedido quedó confirmado.",
        variant: "success",
      });
    },
  });

  const cancelMutation = trpc.orders.cancelOrder.useMutation({
    onError: errorToast,
    onSuccess: async () => {
      await invalidate();
      toast({
        title: "Pedido cancelado",
        description: "Se liberó la reserva de stock.",
        variant: "success",
      });
    },
  });

  const fulfillmentMutation = trpc.orders.updateFulfillment.useMutation({
    onError: errorToast,
    onSuccess: async () => {
      await invalidate();
      toast({
        title: "Estado actualizado",
        variant: "success",
      });
    },
  });

  const isLoading =
    confirmMutation.isPending ||
    cancelMutation.isPending ||
    fulfillmentMutation.isPending;

  const refundButton = (
    <RefundButton
      orderId={orderId}
      paidAmountLabel={paidAmountLabel}
      disabled={isLoading}
      onRefunded={invalidate}
    />
  );

  if (status === "payment_submitted") {
    return (
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          disabled={isLoading}
          onClick={() => confirmMutation.mutate({ id: orderId })}
        >
          {confirmMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Confirmar pago"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isLoading}
          onClick={() => cancelMutation.mutate({ id: orderId })}
        >
          Rechazar / cancelar
        </Button>
      </div>
    );
  }

  if (status === "payment_confirmed") {
    return (
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="tracking-number">Nº de guía (opcional)</Label>
          <Input
            id="tracking-number"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Ej. MR123456789VE"
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            disabled={isLoading}
            onClick={() =>
              fulfillmentMutation.mutate({
                id: orderId,
                status: "shipped",
                tracking_number: trackingNumber,
              })
            }
          >
            Marcar como enviado
          </Button>
          {refundButton}
        </div>
      </div>
    );
  }

  if (status === "shipped") {
    return (
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          disabled={isLoading}
          onClick={() =>
            fulfillmentMutation.mutate({
              id: orderId,
              status: "delivered",
            })
          }
        >
          Marcar como entregado
        </Button>
        {refundButton}
      </div>
    );
  }

  if (status === "delivered") {
    return refundButton;
  }

  if (status === "pending_payment") {
    return (
      <Button
        type="button"
        variant="outline"
        disabled={isLoading}
        onClick={() => cancelMutation.mutate({ id: orderId })}
      >
        Cancelar pedido
      </Button>
    );
  }

  return null;
}
