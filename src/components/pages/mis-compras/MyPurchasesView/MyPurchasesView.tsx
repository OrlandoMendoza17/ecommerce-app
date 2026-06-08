"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Package, ChevronRight } from "lucide-react";
import { trpc } from "@/config/trpc.config";
import { useCurrency } from "@/contexts/CurrencyContext/CurrencyContext";
import { useAuth } from "@/hooks/useAuth";
import { getOrderStatusLabel, isOrderPendingPayment } from "@/lib/order-status";

function formatOrderDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-VE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function MyPurchasesView() {
  const router = useRouter();
  const { user, rendered } = useAuth();
  const { formatPrice } = useCurrency();

  const { data: orders = [], isLoading } = trpc.orders.listMine.useQuery(undefined, {
    enabled: !!user,
  });

  if (!rendered) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <Package className="h-16 w-16 text-gray-300 mx-auto" />
        <h1 className="text-xl font-bold text-gray-900">Mis compras</h1>
        <p className="text-gray-600">Inicia sesión para ver tu historial de pedidos.</p>
        <Link
          href="/auth/login"
          className="inline-flex bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Mis compras</h1>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <Package className="h-16 w-16 text-gray-200 mx-auto" />
          <p className="text-gray-600">Aún no tienes compras registradas.</p>
          <Link
            href="/productos"
            className="inline-flex text-primary font-medium hover:underline"
          >
            Explorar productos
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => {
            const pending = isOrderPendingPayment(
              order.status as OrderStatus,
              order.payment_status
            );

            return (
              <li
                key={order.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">{formatOrderDate(order.created_at)}</p>
                      <p className="font-semibold text-gray-900 mt-0.5">
                        Pedido #{order.order_number}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                        pending
                          ? "bg-amber-100 text-amber-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {getOrderStatusLabel(order.status as OrderStatus)}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    {order.preview_image ? (
                      <Image
                        src={order.preview_image}
                        alt=""
                        width={64}
                        height={64}
                        className="rounded-lg object-cover h-16 w-16 border border-gray-100"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-600">
                        {order.item_count} producto{order.item_count !== 1 ? "s" : ""}
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {formatPrice(order.total)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row gap-2">
                    {pending && (
                      <Link
                        href={`/pedido/${order.id}/pago`}
                        className="flex-1 inline-flex items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 px-4 rounded-lg text-sm transition-colors"
                      >
                        Completar pago
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => router.push(`/pedido/${order.id}/confirmacion`)}
                      className="flex-1 inline-flex items-center justify-center gap-1 border border-gray-300 text-gray-700 font-medium py-2.5 px-4 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                    >
                      Ver detalle
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
