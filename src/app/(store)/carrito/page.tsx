"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, ShoppingBag, ArrowLeft, ShoppingCart, Loader2 } from "lucide-react";
import CartLineItem from "@/components/shared/CartLineItem/CartLineItem";
import { useCart } from "@/contexts/CartContext/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext/CurrencyContext";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { trpc } from "@/config/trpc.config";

export default function CartPage() {
  const router = useRouter();
  const { toast, errorToast } = useToast();
  const { user, rendered: authRendered } = useAuth();
  const {
    items,
    totalItems,
    subtotal,
    updateQuantity,
    removeItem,
    clear,
    isLoading,
    isItemUpdating,
    isAuthenticated,
  } = useCart();
  const { formatPrice } = useCurrency();

  const createOrderMutation = trpc.orders.createFromCart.useMutation({
    onError: (err) => {
      if (err.data?.code === "UNAUTHORIZED") {
        toast({
          title: "Inicia sesión",
          description: "Necesitas estar autenticado para confirmar tu pedido.",
          variant: "error",
        });
        return;
      }
      errorToast(err);
    },
  });

  const handleQuantityChange = async (cartItemId: string, quantity: number) => {
    try {
      await updateQuantity(cartItemId, quantity);
    } catch (error) {
      toast({
        title: "Stock insuficiente",
        description:
          error instanceof Error
            ? error.message
            : "No hay suficientes unidades disponibles",
        variant: "error",
      });
    }
  };

  const handleConfirmPayment = async () => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Necesitas estar autenticado para confirmar tu pedido.",
        variant: "error",
      });
      return;
    }

    if (!isAuthenticated || items.length === 0) return;

    try {
      const order = await createOrderMutation.mutateAsync({});
      await clear();
      router.push(`/pedido/${order.id}/pago`);
    } catch {
      // onError handled above
    }
  };

  if (isLoading || !authRendered) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/productos"
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Seguir comprando
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 ml-auto sm:ml-0">
          Tu carrito{" "}
          {totalItems > 0 && (
            <span className="text-gray-500 font-normal text-lg">({totalItems} productos)</span>
          )}
        </h1>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-24 space-y-6">
          <ShoppingBag className="h-20 w-20 text-gray-200 mx-auto" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Tu carrito está vacío</h2>
            <p className="text-gray-500">¿No sabes qué comprar? ¡Miles de productos te esperan!</p>
          </div>
          <Link
            href="/productos"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            <ShoppingCart className="h-5 w-5" />
            Ver productos
          </Link>
        </div>
      ) : (
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 space-y-8 lg:space-y-0">
          <div className="lg:col-span-8">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <span className="font-semibold text-gray-900">
                  {items.length} producto{items.length > 1 ? "s" : ""}
                </span>
                <button
                  onClick={clear}
                  className="text-sm text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Vaciar carrito
                </button>
              </div>

              <ul className="divide-y divide-gray-100">
                {items.map((item) => (
                  <CartLineItem
                    key={item.id}
                    item={item}
                    variant="full"
                    isUpdating={isItemUpdating(item.id)}
                    formatPrice={formatPrice}
                    onDecrease={() => handleQuantityChange(item.id, item.quantity - 1)}
                    onIncrease={() => handleQuantityChange(item.id, item.quantity + 1)}
                    onRemove={() => removeItem(item.id)}
                  />
                ))}
              </ul>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24 space-y-4">
              <h2 className="font-bold text-gray-900 text-lg">Resumen del pedido</h2>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Productos ({totalItems})</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Envío</span>
                  <span className="text-green-600 font-medium">A coordinar</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                <span className="font-bold text-gray-900">Total estimado</span>
                <span className="text-xl font-bold text-gray-900">{formatPrice(subtotal)}</span>
              </div>

              {!user && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  Debes{" "}
                  <Link href="/auth/login" className="font-semibold underline">
                    iniciar sesión
                  </Link>{" "}
                  para confirmar tu pedido.
                </p>
              )}

              <button
                type="button"
                disabled={createOrderMutation.isPending || !user}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3.5 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                onClick={handleConfirmPayment}
              >
                {createOrderMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Procesando…
                  </>
                ) : (
                  "Confirmar pago"
                )}
              </button>

              <Link
                href="/productos"
                className="block text-center text-sm text-gray-500 hover:text-primary transition-colors"
              >
                Seguir comprando
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
