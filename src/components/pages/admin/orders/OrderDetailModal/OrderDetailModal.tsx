"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { twMerge } from "tailwind-merge";
import DialogContent from "@/components/widgets/DialogContent/DialogContent";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import OrderDetailContent from "./OrderDetailContent/OrderDetailContent";
import type { OrderDetailModalProps } from "./OrderDetailModal.types";

const CLOSE_ID = "close-order-detail-dialog";

export default function OrderDetailModal({
  className,
  orderId,
  orderNumber,
}: OrderDetailModalProps) {
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  const title = orderNumber
    ? `Pedido #${orderNumber}`
    : "Detalle del pedido";

  return (
    <>
      <DropdownMenuItem
        className="cursor-pointer"
        onSelect={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
      >
        <Eye className="h-4 w-4" />
        Ver detalle
      </DropdownMenuItem>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className={twMerge("OrderDetailModal sm:max-w-[560px]", className)}
          closeId={CLOSE_ID}
          onClose={handleClose}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              Información completa del pedido y productos incluidos.
            </DialogDescription>
          </DialogHeader>

          <OrderDetailContent orderId={orderId} enabled={open} />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
