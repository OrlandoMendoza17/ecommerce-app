"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Package,
  MapPin,
  MessageCircle,
  CreditCard,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  RotateCcw,
  Send,
} from "lucide-react";
import { trpc } from "@/config/trpc.config";
import {
  buildWhatsAppUrl,
  formatWhatsAppDisplayPhone,
  mapPublicStoreSettings,
  STORE_SETTINGS_QUERY_OPTIONS,
} from "@/lib/store-settings";
import { getOrderStatusLabel, isOrderPendingPayment } from "@/lib/order-status";
import { buildOrderWhatsAppMessage } from "@/lib/order-whatsapp";
import {
  formatPaidAmount,
  formatExchangeRateCaption,
} from "@/lib/formatters/currency";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { FaWhatsapp } from "react-icons/fa";

interface OrderDetailViewProps {
  orderId: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-VE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const STATUS_STEPS: { status: OrderStatus; label: string; icon: React.ElementType }[] = [
  { status: "pending_payment", label: "Pago pendiente", icon: Clock },
  { status: "payment_submitted", label: "Pago reportado", icon: Send },
  { status: "payment_confirmed", label: "Pago confirmado", icon: CheckCircle2 },
  { status: "shipped", label: "Enviado", icon: Truck },
  { status: "delivered", label: "Entregado", icon: CheckCircle2 },
];

const TERMINAL_STATUSES: OrderStatus[] = ["cancelled", "refunded"];

function StatusBadge({ status }: { status: OrderStatus }) {
  const config: Record<OrderStatus, { color: string; Icon: React.ElementType }> = {
    pending_payment: { color: "bg-amber-100 text-amber-800", Icon: Clock },
    payment_submitted: { color: "bg-blue-100 text-blue-800", Icon: Send },
    payment_confirmed: { color: "bg-emerald-100 text-emerald-800", Icon: CheckCircle2 },
    shipped: { color: "bg-indigo-100 text-indigo-800", Icon: Truck },
    delivered: { color: "bg-green-100 text-green-800", Icon: CheckCircle2 },
    cancelled: { color: "bg-red-100 text-red-800", Icon: XCircle },
    refunded: { color: "bg-gray-100 text-gray-700", Icon: RotateCcw },
  };

  const { color, Icon } = config[status] ?? config.pending_payment;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
        color
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {getOrderStatusLabel(status)}
    </span>
  );
}

function OrderTimeline({ status }: { status: OrderStatus }) {
  if (TERMINAL_STATUSES.includes(status)) return null;

  const currentIndex = STATUS_STEPS.findIndex((s) => s.status === status);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm font-semibold text-gray-700 mb-4">Estado del pedido</p>
      <ol className="relative flex flex-col gap-0">
        {STATUS_STEPS.map((step, index) => {
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isUpcoming = index > currentIndex;
          const Icon = step.icon;

          return (
            <li key={step.status} className="flex gap-3 items-start">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    isDone && "border-primary bg-primary text-primary-foreground",
                    isCurrent && "border-primary bg-white text-primary",
                    isUpcoming && "border-gray-200 bg-white text-gray-300"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                </div>
                {index < STATUS_STEPS.length - 1 && (
                  <div
                    className={cn(
                      "w-0.5 flex-1 my-1 min-h-6",
                      isDone ? "bg-primary" : "bg-gray-200"
                    )}
                  />
                )}
              </div>
              <div className="pb-4 pt-0.5 min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium leading-none",
                    isCurrent ? "text-primary" : isDone ? "text-gray-700" : "text-gray-400"
                  )}
                >
                  {step.label}
                </p>
                {isCurrent && (
                  <p className="text-xs text-gray-500 mt-1">Estado actual</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default function OrderDetailView({ orderId }: OrderDetailViewProps) {
  const { user } = useAuth();
  const { data: order, isLoading, isError } = trpc.orders.getById.useQuery({ id: orderId });
  const { data: settings } = trpc.storeSettings.get.useQuery(undefined, STORE_SETTINGS_QUERY_OPTIONS);

  const store = mapPublicStoreSettings(settings);

  const customerName =
    order?.shipping_full_name?.trim() ||
    (typeof user?.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : "") ||
    "";

  const whatsAppMessage = buildOrderWhatsAppMessage({
    orderNumber: order?.order_number ?? "",
    customerName,
    shippingFullName: order?.shipping_full_name,
    shippingDeliveryMode: order?.shipping_delivery_mode,
    shippingAddressLine1: order?.shipping_address_line1,
    shippingCity: order?.shipping_city,
    shippingState: order?.shipping_state,
    shippingCountry: order?.shipping_country,
  });
  const whatsAppUrl = buildWhatsAppUrl(store.whatsappNumber, whatsAppMessage);
  const displayPhone = formatWhatsAppDisplayPhone(store.whatsappNumber, store.supportPhone);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <Package className="h-16 w-16 text-gray-200 mx-auto" />
        <p className="text-gray-600">No pudimos cargar los detalles del pedido.</p>
        <Link href="/mis-compras" className="text-primary font-medium hover:underline">
          Volver a mis compras
        </Link>
      </div>
    );
  }

  const hasPaidData = order.paid_total > 0;
  const addressParts = [
    order.shipping_address_line1,
    order.shipping_address_line2,
    order.shipping_city && order.shipping_state
      ? `${order.shipping_city}, ${order.shipping_state}`
      : order.shipping_city || order.shipping_state,
    order.shipping_postal_code,
    order.shipping_country,
  ].filter(Boolean);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link
            href="/mis-compras"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Mis compras
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-700 font-medium truncate">
            Pedido #{order.order_number}
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Hero — full width */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">{formatDate(order.created_at)}</p>
              <h1 className="text-xl font-bold text-gray-900">
                Pedido #{order.order_number}
              </h1>
            </div>
            <StatusBadge status={order.status} />
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            {isOrderPendingPayment(order.status) && (
              <Link
                href={`/pedido/${orderId}/pago`}
                className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 px-4 rounded-lg text-sm transition-colors"
              >
                <CreditCard className="h-4 w-4" />
                Completar pago
              </Link>
            )}
            {whatsAppUrl && (
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2.5 px-4 rounded-lg text-sm transition-colors"
              >
                <FaWhatsapp className="h-4 w-4 text-[#25d366]" />
                Contactar al vendedor
                {displayPhone && (
                  <span className="text-gray-400 text-xs">· {displayPhone}</span>
                )}
              </a>
            )}
          </div>
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 items-start">
          {/* Left: products + shipping */}
          <div className="space-y-4 min-w-0">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm font-semibold text-gray-700 mb-4">
                Productos ({order.items.length})
              </p>
              <ul className="divide-y divide-gray-100">
                {order.items.map((item) => (
                  <li key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="h-14 w-14 shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                      {item.product_image_url ? (
                        <Image
                          src={item.product_image_url}
                          alt={item.product_name}
                          width={56}
                          height={56}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Package className="h-5 w-5 text-gray-400" aria-hidden />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 leading-snug line-clamp-2">
                        {item.product_name}
                      </p>
                      {Object.keys(item.selected_options).length > 0 && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {Object.entries(item.selected_options)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(" · ")}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">Cant.: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 tabular-nums shrink-0">
                      {formatPaidAmount(item.paid_subtotal, order.payment_currency, item.subtotal)}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="mt-4 pt-4 border-t border-gray-100 space-y-1.5">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span className="tabular-nums">
                    {formatPaidAmount(0, order.payment_currency, order.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-sm font-bold text-gray-900">Total</span>
                  <span className="text-base font-bold text-gray-900 tabular-nums">
                    {formatPaidAmount(
                      hasPaidData ? order.paid_total : 0,
                      order.payment_currency,
                      order.total
                    )}
                  </span>
                </div>
                {order.payment_currency !== "USD" && order.payment_exchange_rate > 1 && (
                  <p className="text-xs text-gray-400 text-right">
                    Tasa:{" "}
                    {formatExchangeRateCaption(
                      order.payment_exchange_rate,
                      order.payment_currency
                    )}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm font-semibold text-gray-700 mb-3">Entrega</p>
              {order.shipping_delivery_mode === "coordinate" ? (
                <div className="flex gap-3 items-start">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MessageCircle className="h-4 w-4 text-primary" aria-hidden />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Coordinar con el vendedor</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      El vendedor se pondrá en contacto contigo para acordar la entrega.
                    </p>
                  </div>
                </div>
              ) : order.shipping_delivery_mode === "address" && addressParts.length > 0 ? (
                <div className="flex gap-3 items-start">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="h-4 w-4 text-primary" aria-hidden />
                  </div>
                  <div>
                    {order.shipping_full_name && (
                      <p className="text-sm font-medium text-gray-900">
                        {order.shipping_full_name}
                      </p>
                    )}
                    {order.shipping_phone && (
                      <p className="text-xs text-gray-500">{order.shipping_phone}</p>
                    )}
                    <p className="text-sm text-gray-700 mt-1">{addressParts.join(", ")}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Aún no has seleccionado una modalidad de entrega.
                </p>
              )}
            </div>
          </div>

          {/* Right: timeline + help (sticky on desktop) */}
          <aside className="space-y-4 lg:sticky lg:top-6">
            <OrderTimeline status={order.status} />
          </aside>
        </div>
      </div>
    </div>
  );
}
