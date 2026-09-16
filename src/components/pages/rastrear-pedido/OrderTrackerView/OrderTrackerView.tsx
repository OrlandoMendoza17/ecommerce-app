"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search, Package, Loader2, ArrowRight } from "lucide-react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import FormInput from "@/components/form/FormInput/FormInput";
import { trpc } from "@/config/trpc.config";
import { getOrderStatusLabel } from "@/lib/order-status";
import { formatPaidAmount, formatExchangeRateCaption } from "@/lib/formatters/currency";
import {
  orderTrackerSchema,
  orderTrackerDefaultValues,
  type OrderTrackerFormValues,
} from "./OrderTrackerView.helpers";

interface OrderTrackerViewProps {
  initialOrderNumber?: string;
}

const statusBadgeClass = (status: string): string => {
  switch (status) {
    case "pending_payment":
      return "bg-warning text-warning-foreground";
    case "payment_submitted":
      return "bg-warning text-warning-foreground";
    case "payment_confirmed":
      return "bg-info text-info-foreground";
    case "shipped":
      return "bg-indigo text-indigo-foreground";
    case "delivered":
      return "bg-success text-success-foreground";
    case "cancelled":
    case "refunded":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export default function OrderTrackerView({ initialOrderNumber }: OrderTrackerViewProps) {
  const [submittedQuery, setSubmittedQuery] = useState<OrderTrackerFormValues | null>(
    initialOrderNumber ? null : null
  );

  const form = useForm<OrderTrackerFormValues>({
    resolver: zodResolver(orderTrackerSchema),
    defaultValues: orderTrackerDefaultValues(initialOrderNumber),
  });

  const { control, handleSubmit } = form;

  const { data: order, isLoading, isError, error } = trpc.orders.trackByNumber.useQuery(
    submittedQuery ?? { order_number: "", email: "" },
    { enabled: !!submittedQuery }
  );

  const onSubmit = handleSubmit((data) => {
    setSubmittedQuery({ order_number: data.order_number.trim(), email: data.email.trim() });
  });

  const isNotFound =
    isError &&
    (error as { data?: { code?: string } })?.data?.code === "NOT_FOUND";

  const handleNewSearch = () => {
    setSubmittedQuery(null);
    form.setValue("email", "");
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-10 space-y-6">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
          <Package className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Rastrear pedido</h1>
        <p className="text-sm text-muted-foreground">
          Ingresa el número de pedido y el correo electrónico con el que realizaste la compra.
        </p>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border p-6">
        <Form {...form}>
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <FormInput
              name="order_number"
              control={control}
              label="Número de pedido"
              placeholder="Ej: 26000123"
              disabled={isLoading}
            />
            <FormInput
              name="email"
              control={control}
              label="Correo electrónico"
              placeholder="tu@correo.com"
              type="email"
              disabled={isLoading}
            />

            {isNotFound && (
              <p className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
                No encontramos ningún pedido con esa combinación de número y correo.
              </p>
            )}

            {isError && !isNotFound && (
              <p className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
                Ocurrió un error. Por favor, intenta de nuevo.
              </p>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Buscando…
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Buscar pedido
                </>
              )}
            </Button>
          </form>
        </Form>
      </div>

      {order && (
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Pedido</p>
              <p className="font-semibold text-foreground">#{order.order_number}</p>
            </div>
            <span
              className={`text-xs font-semibold px-3 py-1.5 rounded-full ${statusBadgeClass(order.status)}`}
            >
              {getOrderStatusLabel(order.status as OrderStatus)}
            </span>
          </div>

          <div className="px-5 py-4 space-y-3">
            {order.shipping_full_name && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Destinatario</span>
                <span className="font-medium text-foreground">{order.shipping_full_name}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fecha</span>
              <span className="font-medium text-foreground">
                {new Date(order.created_at).toLocaleDateString("es-VE", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          {order.items.length > 0 && (
            <div className="px-5 pb-4 border-t border-border pt-4">
              <p className="text-sm font-medium text-foreground mb-3">Productos</p>
              <ul className="space-y-3">
                {order.items.map((item) => (
                  <li key={item.id} className="flex gap-3 items-center">
                    {item.product_image_url ? (
                      <Image
                        src={item.product_image_url}
                        alt={item.product_name}
                        width={48}
                        height={48}
                        className="rounded-md object-cover h-12 w-12 border border-border"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-md bg-muted border border-border" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground">Cantidad: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium text-foreground tabular-nums">
                      {formatPaidAmount(item.paid_subtotal, order.payment_currency, item.subtotal)}
                    </p>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
                <span className="text-sm font-semibold text-foreground">Total</span>
                <span className="text-base font-bold text-foreground">
                  {formatPaidAmount(order.paid_total, order.payment_currency, order.total)}
                </span>
              </div>
              {order.payment_currency !== "USD" && order.payment_exchange_rate > 1 && (
                <p className="text-xs text-muted-foreground text-right mt-1">
                  Tasa: {formatExchangeRateCaption(order.payment_exchange_rate, order.payment_currency)}
                </p>
              )}
            </div>
          )}

          {order.status === "pending_payment" && (
            <div className="px-5 pb-4">
              <Link
                href={`/pedido/${order.id}/pago`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 px-4 py-2.5 rounded-md transition-colors"
              >
                Completar pago
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}

          <div className="px-5 pb-4 pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              ¿Tienes cuenta?{" "}
              <Link href="/mis-compras" className="text-primary hover:underline font-medium">
                Ve todos tus pedidos en Mis compras
              </Link>
            </p>
          </div>
        </div>
      )}

      {order && (
        <button
          type="button"
          className="block mx-auto text-sm text-muted-foreground hover:text-primary hover:underline"
          onClick={handleNewSearch}
        >
          Buscar otro pedido
        </button>
      )}
    </div>
  );
}
