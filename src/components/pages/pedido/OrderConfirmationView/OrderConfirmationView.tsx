"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, SendHorizonal } from "lucide-react";
import { trpc } from "@/config/trpc.config";
import {
  STORE_SETTINGS_QUERY_OPTIONS,
  buildWhatsAppUrl,
  formatWhatsAppDisplayPhone,
  mapPublicStoreSettings,
} from "@/lib/store-settings";
import { FaFacebook, FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa";
import type { IconType } from "react-icons";
import { getOrderStatusLabel, isOrderAwaitingConfirmation } from "@/lib/order-status";
import { buildOrderWhatsAppMessage } from "@/lib/order-whatsapp";
import { formatPaidAmount, formatExchangeRateCaption } from "@/lib/formatters/currency";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";

interface OrderConfirmationViewProps {
  orderId: string;
}

export default function OrderConfirmationView({ orderId }: OrderConfirmationViewProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const awaitingConfirmationToastShownFor = useRef<string | null>(null);

  const [guestAccessToken] = useState<string | undefined>(() =>
    typeof window !== "undefined"
      ? localStorage.getItem(`guest_order_${orderId}`) ?? undefined
      : undefined
  );

  const isGuest = !!guestAccessToken && !user;

  const { data: order, isLoading, isError } = trpc.orders.getById.useQuery({
    id: orderId,
    guest_access_token: guestAccessToken,
  });
  const { data: settings } = trpc.storeSettings.get.useQuery(
    undefined,
    STORE_SETTINGS_QUERY_OPTIONS
  );

  useEffect(() => {
    if (!order || !isOrderAwaitingConfirmation(order.status)) return;
    if (awaitingConfirmationToastShownFor.current === order.id) return;

    awaitingConfirmationToastShownFor.current = order.id;
    toast({
      title: "Comprobante recibido",
      description: "Te avisaremos cuando el pago sea confirmado.",
      variant: "success",
      duration: 8_000,
    });
  }, [order, toast]);

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

  const socialLinks: { href: string; label: string; icon: IconType }[] = [
    { href: store.social.instagram, label: "Instagram", icon: FaInstagram },
    { href: store.social.facebook, label: "Facebook", icon: FaFacebook },
    { href: store.social.tiktok, label: "TikTok", icon: FaTiktok },
  ].filter((item): item is { href: string; label: string; icon: IconType } => Boolean(item.href));

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
        <p className="text-gray-600">No pudimos cargar los detalles del pedido.</p>
        {isGuest ? (
          <Link href="/rastrear-pedido" className="text-primary font-medium hover:underline">
            Rastrear pedido
          </Link>
        ) : (
          <Link href="/mis-compras" className="text-primary font-medium hover:underline">
            Ir a mis compras
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ededed] pb-12">
      <div className="bg-linear-to-b from-primary/20 via-primary/5 to-[#ededed] pt-8 pb-6">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
                {isOrderAwaitingConfirmation(order.status)
                  ? "Pago reportado"
                  : "¡Listo, compraste!"}
              </h1>
              <CheckCircle2 className="h-12 w-12 text-[#00a650] shrink-0" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4 mt-4">
            {order.order_number && (
              <div className="border-gray-100 space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                      Número de pedido
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">
                      #{order.order_number}
                    </p>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    {getOrderStatusLabel(order.status)}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-3 flex-wrap">
                  <Link
                    href={`/rastrear-pedido?n=${order.order_number}`}
                    className="inline-flex items-center gap-1 text-sm text-primary font-medium hover:underline"
                  >
                    Rastrear pedido <span aria-hidden>→</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 space-y-4 -mt-2">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-4">
          <div className="flex gap-3">
            <div className="h-10 w-10 rounded-full bg-[#00a650]/10 flex items-center justify-center shrink-0">
              <FaWhatsapp className="h-5 w-5 text-[#00a650]" />
            </div>
            <div>
              <p className="font-medium text-gray-900 leading-snug">
                Escríbele al vendedor para coordinar la entrega y el pago
              </p>
              {displayPhone ? (
                <p className="text-sm text-gray-500 mt-1">Teléfono: {displayPhone}</p>
              ) : null}
              <p className="text-sm text-gray-500 mt-1">
                Por seguridad, hazlo únicamente a través de los mensajes de la compra.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {order.status === "pending_payment" && order.payment_status === "pending" ? (
              <Link
                href={`/pedido/${orderId}/pago`}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-[#3483fa] hover:bg-[#2968c8] text-white font-semibold py-3 px-4 rounded-md text-sm transition-colors text-center"
              >
                Completar pago
              </Link>
            ) : null}
            {whatsAppUrl ? (
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 bg-[#3483fa] hover:bg-[#2968c8] text-white font-semibold py-3 px-4 rounded-md text-sm transition-colors"
              >
                <SendHorizonal className="h-4 w-4" />
                Escribirle al vendedor
              </a>
            ) : null}
            {!isGuest ? (
              <Link
                href="/mis-compras"
                className="flex-1 inline-flex items-center justify-center bg-[#e3eefb] hover:bg-[#d4e4f7] text-[#3483fa] font-semibold py-3 px-4 rounded-md text-sm transition-colors text-center"
              >
                Ir a Mis compras
              </Link>
            ) : null}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-4">
          <div>
            <p className="font-medium text-gray-900">Síguenos en nuestras redes sociales</p>
          </div>

          {socialLinks.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {socialLinks.map(({ href, label, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-[#3483fa] hover:underline"
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {label}
                </a>
              ))}
            </div>
          ) : null}
        </div>

        {order.items.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <p className="text-sm font-medium text-gray-900 mb-3">Tu pedido</p>
            <ul className="space-y-3">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-3 items-center">
                  {item.product_image_url ? (
                    <Image
                      src={item.product_image_url}
                      alt={item.product_name}
                      width={48}
                      height={48}
                      className="rounded-md object-cover h-12 w-12"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-md bg-gray-100" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{item.product_name}</p>
                    <p className="text-xs text-gray-500">Cantidad: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-medium text-gray-900 tabular-nums">
                    {formatPaidAmount(item.paid_subtotal, order.payment_currency, item.subtotal)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
              <span className="text-sm font-semibold text-gray-900">Total</span>
              <span className="text-base font-bold text-gray-900">
                {formatPaidAmount(order.paid_total, order.payment_currency, order.total)}
              </span>
            </div>
            {order.payment_currency !== "USD" && order.payment_exchange_rate > 1 && (
              <p className="text-xs text-gray-400 text-right mt-1">
                Tasa: {formatExchangeRateCaption(order.payment_exchange_rate, order.payment_currency)}
              </p>
            )}
          </div>
        )}


      </div>
    </div>
  );
}
