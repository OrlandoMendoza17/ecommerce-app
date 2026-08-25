"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Package } from "lucide-react";
import { trpc } from "@/config/trpc.config";
import { formatDate } from "@/lib/formatters/date";
import {
  formatCurrency,
  formatPaidAmount,
  formatExchangeRateCaption,
  formatStorePrice,
  getCurrencyDisplayLabel,
} from "@/lib/formatters/currency";
import { getOrderStatusLabel } from "@/lib/order-status";
import { getPaymentMethodDisplayName } from "@/lib/payment-methods";
import { PAYMENT_METHODS_BY_TYPE } from "@/constants/payment-methods";
import OrderDetailActions from "@/components/pages/admin/orders/OrderDetailModal/OrderDetailContent/OrderDetailActions";

const EMPTY = "—";

const statusBadgeClass = (status: OrderStatus): string => {
  switch (status) {
    case "pending_payment": return "bg-amber-100 text-amber-800";
    case "payment_submitted": return "bg-orange-100 text-orange-800";
    case "payment_confirmed": return "bg-blue-100 text-blue-800";
    case "shipped": return "bg-indigo-100 text-indigo-800";
    case "delivered": return "bg-emerald-100 text-emerald-800";
    case "cancelled":
    case "refunded": return "bg-gray-100 text-gray-600";
    default: return "bg-gray-100 text-gray-600";
  }
};

function formatOptions(options: Record<string, string>): string | null {
  const entries = Object.entries(options).filter(([, v]) => v);
  if (entries.length === 0) return null;
  return entries.map(([k, v]) => `${k}: ${v}`).join(" · ");
}

interface OrderDetailViewProps {
  orderId: string;
}

export default function OrderDetailView({ orderId }: OrderDetailViewProps) {
  const { data: order, isLoading, isError, refetch } = trpc.orders.getByIdAdmin.useQuery(
    { id: orderId }
  );
  const { data: storeSettings } = trpc.storeSettings.get.useQuery(undefined, {
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
  const storeCurrency = storeSettings?.currency === "EUR" ? "EUR" : "USD";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center space-y-4">
        <p className="text-muted-foreground">No se pudo cargar el pedido.</p>
        <Link href="/admin/orders" className="text-primary hover:underline text-sm">
          Volver a pedidos
        </Link>
      </div>
    );
  }

  const customerName =
    order.profile?.full_name?.trim() || order.shipping_full_name?.trim() || EMPTY;
  const customerEmail = order.profile?.email?.trim() || EMPTY;
  const customerPhone =
    order.profile?.phone?.trim() || order.shipping_phone?.trim() || EMPTY;

  const addressParts = [
    order.shipping_address_line1,
    order.shipping_address_line2,
    [order.shipping_city, order.shipping_state].filter(Boolean).join(", "),
    order.shipping_postal_code,
    order.shipping_country,
  ].filter((p) => p?.trim());

  const showExchangeRate =
    Boolean(order.payment_currency) &&
    order.payment_currency !== "USD" &&
    order.payment_exchange_rate > 1;

  const paidTotalLabel = formatPaidAmount(
    order.paid_total,
    order.payment_currency,
    order.total
  );
  const storeTotalLabel = formatStorePrice(order.total, storeCurrency);

  return (
    <div className="flex-1 overflow-y-auto bg-muted min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Back + heading */}
        <div>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a pedidos
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Pedido #{order.order_number}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Consulta el detalle completo, gestiona el pago y actualiza el estado del envío.
              </p>
            </div>
          </div>
        </div>

        {/* Order summary card */}
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          {/* Summary row */}
          <div
            className={`grid grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border border-b border-border ${showExchangeRate ? "sm:grid-cols-4" : "sm:grid-cols-3"
              }`}
          >
            <div className="px-5 py-4">
              <p className="text-xs text-muted-foreground mb-1">Nº de pedido</p>
              <p className="text-sm font-semibold font-mono">#{order.order_number}</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-xs text-muted-foreground mb-1">Fecha del pedido</p>
              <p className="text-sm font-semibold">{formatDate(order.created_at)}</p>
            </div>
            {showExchangeRate && (
              <div className="px-5 py-4">
                <p className="text-xs text-muted-foreground mb-1">Tasa</p>
                <p className="text-sm font-semibold">
                  {formatExchangeRateCaption(order.payment_exchange_rate, order.payment_currency)}
                </p>
              </div>
            )}
            <div className="px-5 py-4">
              <p className="text-xs text-muted-foreground mb-1">Estado de pago</p>
              <span
                className={`self-start sm:self-center text-xs font-semibold px-3 py-1.5 rounded-full ${statusBadgeClass(order.status)}`}
              >
                {getOrderStatusLabel(order.status)}
              </span>
            </div>
          </div>

          {/* Products table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Producto
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    Precio u.
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Cant.
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {order.items.map((item) => {
                  const optionsLabel = formatOptions(item.selected_options);
                  const paidUnit = formatPaidAmount(
                    item.paid_unit_price,
                    order.payment_currency,
                    item.unit_price
                  );
                  const storeUnit = formatStorePrice(item.unit_price, storeCurrency);
                  const paidLine = formatPaidAmount(
                    item.paid_subtotal,
                    order.payment_currency,
                    item.subtotal
                  );
                  const storeLine = formatStorePrice(item.subtotal, storeCurrency);

                  return (
                    <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {item.product_image_url ? (
                            <Image
                              src={item.product_image_url}
                              alt={item.product_name}
                              width={48}
                              height={48}
                              className="rounded-lg object-cover h-12 w-12 shrink-0 border border-border"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium leading-snug truncate max-w-[240px]">
                              {item.product_name}
                            </p>
                            {optionsLabel && (
                              <p className="text-xs text-muted-foreground mt-0.5">{optionsLabel}</p>
                            )}
                            {(item.variant_sku || item.product_sku) && (
                              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                                SKU: {item.variant_sku || item.product_sku}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right tabular-nums">
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-muted-foreground">{paidUnit}</span>
                          {storeUnit !== paidUnit && (
                            <span className="text-xs text-muted-foreground/70">{storeUnit}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right tabular-nums">
                        {item.quantity}
                      </td>
                      <td className="px-5 py-4 text-right tabular-nums">
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="font-medium">{paidLine}</span>
                          {storeLine !== paidLine && (
                            <span className="text-xs text-muted-foreground/70">{storeLine}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals footer */}
          <div className="border-t border-border px-5 py-4 flex justify-end">
            <div className="w-full max-w-xs space-y-2">
              {order.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Descuento</span>
                  <span className="text-emerald-600">-{formatCurrency(order.discount)}</span>
                </div>
              )}
              {order.shipping_cost > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Envío</span>
                  <span>{formatCurrency(order.shipping_cost)}</span>
                </div>
              )}
              {order.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Impuestos</span>
                  <span>{formatCurrency(order.tax)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold pt-2">
                <span>Total</span>
                <div className="flex flex-col items-end gap-0.5">
                  <span>{paidTotalLabel}</span>
                  {storeTotalLabel !== paidTotalLabel && (
                    <span className="text-xs font-normal text-muted-foreground/70">
                      {storeTotalLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: actions + payment */}
          <div className="lg:col-span-2 space-y-6">

            {/* Payment details */}
            {(order.payment_method ||
              order.issuer_bank?.trim() ||
              order.payment_reference?.trim() ||
              order.payment_proof_url?.trim() ||
              order.payment_currency !== "USD" ||
              order.paid_total > 0) && (
                <div className="bg-white rounded-xl border border-border p-5 space-y-3">
                  <h2 className="text-sm font-semibold">Datos de pago</h2>
                  {order.payment_method && (
                    <div className="flex justify-between items-center gap-3 text-sm">
                      <span className="text-muted-foreground shrink-0">Método de pago</span>
                      <span className="inline-flex items-center gap-2 font-medium text-right">
                        {PAYMENT_METHODS_BY_TYPE[order.payment_method.type]?.icon ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={PAYMENT_METHODS_BY_TYPE[order.payment_method.type].icon}
                            alt=""
                            className="size-5 object-contain shrink-0"
                          />
                        ) : null}
                        {getPaymentMethodDisplayName(order.payment_method)}
                      </span>
                    </div>
                  )}
                  {(order.payment_currency !== "USD" || order.paid_total > 0) && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Moneda</span>
                      <span className="font-medium">{getCurrencyDisplayLabel(order.payment_currency)}</span>
                    </div>
                  )}
                  {order.paid_total > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Monto pagado</span>
                      <span className="font-semibold">{formatPaidAmount(order.paid_total, order.payment_currency, order.total)}</span>
                    </div>
                  )}
                  {order.issuer_bank?.trim() && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Banco emisor</span>
                      <span className="font-medium">{order.issuer_bank}</span>
                    </div>
                  )}
                  {order.payment_reference?.trim() && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Referencia</span>
                      <span className="font-mono font-medium">{order.payment_reference}</span>
                    </div>
                  )}
                  {order.payment_proof_url?.trim() && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Comprobante</span>
                      <a
                        href={order.payment_proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Ver comprobante
                      </a>
                    </div>
                  )}
                </div>
              )}

            {/* Actions */}
            <div className="bg-white rounded-xl border border-border p-5 space-y-4">
              <h2 className="text-sm font-semibold">Acciones del pedido</h2>
              <OrderDetailActions
                orderId={orderId}
                status={order.status}
                onUpdated={refetch}
              />
              {order.status === "cancelled" && (
                <p className="text-sm text-muted-foreground">Este pedido fue cancelado.</p>
              )}
              {order.status === "delivered" && (
                <p className="text-sm text-muted-foreground">Pedido entregado al cliente.</p>
              )}
              {order.status === "refunded" && (
                <p className="text-sm text-muted-foreground">Pedido reembolsado.</p>
              )}
            </div>

          </div>

          {/* Right: customer + shipping */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-border p-5 space-y-3">
              <h2 className="text-sm font-semibold">Cliente</h2>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Nombre</dt>
                  <dd className="font-medium">{customerName}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Email</dt>
                  <dd className="break-all">{customerEmail}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Teléfono</dt>
                  <dd>{customerPhone}</dd>
                </div>
              </dl>
            </div>

            <div className="bg-white rounded-xl border border-border p-5 space-y-3">
              <h2 className="text-sm font-semibold">Envío</h2>
              {order.shipping_delivery_mode === "coordinate" ? (
                <p className="text-sm text-muted-foreground">
                  Coordinar con el vendedor
                </p>
              ) : order.shipping_delivery_mode === "address" && addressParts.length > 0 ? (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {addressParts.join(" · ")}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Pendiente de selección por el cliente
                </p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
