"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { Package } from "lucide-react";
import { trpc } from "@/config/trpc.config";
import { formatDate } from "@/lib/formatters/date";
import { formatCurrency } from "@/lib/formatters/currency";
import { getOrderStatusLabel, getPaymentStatusLabel } from "@/lib/order-status";
import { Separator } from "@/components/ui/separator";
import type { OrderDetailContentProps } from "./OrderDetailContent.types";

const EMPTY = "—";

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-right break-words">{value}</span>
    </div>
  );
}

function formatOptions(options: Record<string, string>) {
  const entries = Object.entries(options).filter(([, v]) => v);
  if (entries.length === 0) return null;
  return entries.map(([k, v]) => `${k}: ${v}`).join(" · ");
}

export default function OrderDetailContent({ orderId, enabled }: OrderDetailContentProps) {
  const { data: order, isLoading, isError } = trpc.orders.getByIdAdmin.useQuery(
    { id: orderId },
    { enabled }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <p className="text-sm text-destructive py-6 text-center">
        No se pudo cargar el detalle del pedido.
      </p>
    );
  }

  const customerName =
    order.profile?.full_name?.trim() || order.shipping_full_name?.trim() || EMPTY;
  const customerEmail = order.profile?.email?.trim();
  const customerPhone =
    order.profile?.phone?.trim() || order.shipping_phone?.trim() || EMPTY;

  const addressParts = [
    order.shipping_address_line1,
    order.shipping_address_line2,
    [order.shipping_city, order.shipping_state].filter(Boolean).join(", "),
    order.shipping_postal_code,
    order.shipping_country,
  ].filter((p) => p?.trim());

  return (
    <div className="space-y-5 max-h-[min(70vh,560px)] overflow-y-auto pr-1">
      {/* Resumen */}
      <section className="space-y-2">
        <DetailRow label="Nº de pedido" value={`#${order.order_number}`} />
        <DetailRow label="Fecha" value={formatDate(order.created_at)} />
        <DetailRow label="Estado" value={getOrderStatusLabel(order.status)} />
        <DetailRow label="Pago" value={getPaymentStatusLabel(order.payment_status)} />
        {order.payment_reference?.trim() && (
          <DetailRow label="Referencia de pago" value={order.payment_reference} />
        )}
      </section>

      <Separator />

      {/* Cliente */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Cliente</h3>
        <DetailRow label="Nombre" value={customerName} />
        {customerEmail && <DetailRow label="Email" value={customerEmail} />}
        <DetailRow label="Teléfono" value={customerPhone} />
      </section>

      {addressParts.length > 0 && (
        <>
          <Separator />
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Envío</h3>
            <p className="text-sm">{addressParts.join(" · ")}</p>
          </section>
        </>
      )}

      <Separator />

      {/* Productos */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
          Productos ({order.items.length})
        </h3>
        <ul className="space-y-3">
          {order.items.map((item) => {
            const optionsLabel = formatOptions(item.selected_options);
            return (
              <li
                key={item.id}
                className="flex gap-3 rounded-lg border border-border p-3 bg-muted/30"
              >
                {item.product_image_url ? (
                  <Image
                    src={item.product_image_url}
                    alt={item.product_name}
                    width={56}
                    height={56}
                    className="rounded-md object-cover h-14 w-14 shrink-0"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <Package className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-medium leading-snug">{item.product_name}</p>
                  {optionsLabel && (
                    <p className="text-xs text-muted-foreground">{optionsLabel}</p>
                  )}
                  {(item.variant_sku || item.product_sku) && (
                    <p className="text-xs text-muted-foreground font-mono">
                      SKU: {item.variant_sku || item.product_sku}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} × {formatCurrency(item.unit_price)} ={" "}
                    <span className="font-medium text-foreground">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <Separator />

      {/* Totales */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Totales</h3>
        <DetailRow label="Subtotal" value={formatCurrency(order.subtotal)} />
        {order.discount > 0 && (
          <DetailRow label="Descuento" value={`-${formatCurrency(order.discount)}`} />
        )}
        {order.shipping_cost > 0 && (
          <DetailRow label="Envío" value={formatCurrency(order.shipping_cost)} />
        )}
        {order.tax > 0 && <DetailRow label="Impuestos" value={formatCurrency(order.tax)} />}
        <DetailRow
          label="Total"
          value={
            <span className="text-base font-bold">{formatCurrency(order.total)}</span>
          }
        />
      </section>

      {order.customer_notes?.trim() && (
        <>
          <Separator />
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Notas del cliente</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {order.customer_notes}
            </p>
          </section>
        </>
      )}
    </div>
  );
}
