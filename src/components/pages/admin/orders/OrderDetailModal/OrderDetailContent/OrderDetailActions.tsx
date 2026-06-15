"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { trpc } from "@/config/trpc.config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/useToast";

interface OrderDetailActionsProps {
  orderId: string;
  status: OrderStatus;
  onUpdated: () => void;
}

export default function OrderDetailActions({
  orderId,
  status,
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
      </div>
    );
  }

  if (status === "shipped") {
    return (
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
    );
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
