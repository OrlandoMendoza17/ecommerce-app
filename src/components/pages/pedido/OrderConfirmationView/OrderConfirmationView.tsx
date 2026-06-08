"use client";

import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, MessageCircle, ExternalLink } from "lucide-react";
import { STORE_CONTACT, buildWhatsAppUrl } from "@/config/store-contact.config";
import { trpc } from "@/config/trpc.config";

interface OrderConfirmationViewProps {
  orderId: string;
}

export default function OrderConfirmationView({ orderId }: OrderConfirmationViewProps) {
  const { data: order, isLoading, isError } = trpc.orders.getById.useQuery({ id: orderId });

  const whatsAppMessage = order
    ? `Hola, acabo de realizar el pedido #${order.order_number}. Quisiera coordinar el pago y la entrega.`
    : "Hola, acabo de realizar un pedido en la tienda. Quisiera coordinar el pago y la entrega.";

  const whatsAppUrl = buildWhatsAppUrl(STORE_CONTACT.sellerWhatsApp, whatsAppMessage);

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
        <Link href="/mis-compras" className="text-primary font-medium hover:underline">
          Ir a mis compras
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ededed] pb-12">
      {/* Header estilo Mercado Libre */}
      <div className="bg-gradient-to-b from-[#00a650]/20 via-[#00a650]/5 to-[#ededed] pt-8 pb-6">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex items-center justify-between gap-4">
            <h1 className="text-2xl sm:text-3xl font-normal text-gray-900">
              ¡Listo, compraste!
            </h1>
            <CheckCircle2 className="h-12 w-12 text-[#00a650] shrink-0" />
          </div>
          {order.order_number && (
            <p className="text-center text-sm text-gray-600 mt-3">
              Pedido <span className="font-semibold">#{order.order_number}</span>
            </p>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 space-y-4 -mt-2">
        {/* Coordinar con vendedor */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-4">
          <div className="flex gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-gray-900 leading-snug">
                Escríbele al vendedor para coordinar la entrega y el pago
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Teléfono: {STORE_CONTACT.displayPhone}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Por seguridad, hazlo únicamente a través de los mensajes de la compra.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {order.status === "pending" && order.payment_status === "pending" ? (
              <Link
                href={`/pedido/${orderId}/pago`}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-[#3483fa] hover:bg-[#2968c8] text-white font-semibold py-3 px-4 rounded-md text-sm transition-colors text-center"
              >
                Completar pago
              </Link>
            ) : null}
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-[#3483fa] hover:bg-[#2968c8] text-white font-semibold py-3 px-4 rounded-md text-sm transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              Escribirle al vendedor
            </a>
            <Link
              href="/mis-compras"
              className="flex-1 inline-flex items-center justify-center bg-[#e3eefb] hover:bg-[#d4e4f7] text-[#3483fa] font-semibold py-3 px-4 rounded-md text-sm transition-colors text-center"
            >
              Ir a Mis compras
            </Link>
          </div>
        </div>

        {/* Seguir tienda */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-4">
          <div>
            <p className="font-medium text-gray-900">Sigue a la tienda donde compraste</p>
            <p className="text-sm text-gray-500 mt-1">
              Entérate de sus novedades y aprovecha los beneficios.
            </p>
          </div>

          <div className="flex items-center justify-between gap-4 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                <span className="text-lg font-bold text-gray-400">
                  {STORE_CONTACT.storeName.charAt(0)}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate uppercase text-sm">
                  {STORE_CONTACT.storeHandle}
                </p>
                <p className="text-xs text-gray-500">{STORE_CONTACT.followersLabel}</p>
              </div>
            </div>
            <button
              type="button"
              className="shrink-0 bg-[#3483fa] hover:bg-[#2968c8] text-white text-sm font-semibold px-4 py-2 rounded-md transition-colors"
            >
              Seguir
            </button>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href={STORE_CONTACT.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-[#3483fa] hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Instagram
            </a>
            <a
              href={STORE_CONTACT.social.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-[#3483fa] hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Facebook
            </a>
            <a
              href={STORE_CONTACT.social.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-[#3483fa] hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              TikTok
            </a>
          </div>
        </div>

        {/* Resumen breve */}
        {order.items.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <p className="text-sm font-medium text-gray-900 mb-3">Tu pedido</p>
            <ul className="space-y-3">
              {order.items.slice(0, 3).map((item) => (
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
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
