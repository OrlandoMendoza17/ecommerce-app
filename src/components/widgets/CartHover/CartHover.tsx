"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ShoppingCart, ShoppingBag } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import CartLineItem from "@/components/shared/CartLineItem/CartLineItem";
import { useCart } from "@/contexts/CartContext/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext/CurrencyContext";
import { useToast } from "@/hooks/useToast";
import { CartHoverProps } from "./CartHover.types";

const PREVIEW_LIMIT = 4;

export default function CartHover({ className = "" }: CartHoverProps) {
  const { items, totalItems, subtotal, updateQuantity, removeItem, isLoading, isItemUpdating } =
    useCart();
  const { formatPrice, formatBsPrice } = useCurrency();
  const { toast } = useToast();

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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const previewItems = items.slice(0, PREVIEW_LIMIT);
  const remaining = items.length - previewItems.length;

  const openDropdown = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setDropdownOpen(true);
  };

  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setDropdownOpen(false), 150);
  };

  const CartBadge = () => (
    <div className="relative">
      <ShoppingCart className="h-6 w-6" />
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center leading-none">
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      )}
    </div>
  );

  const CartContent = ({ onClose }: { onClose?: () => void }) => (
    <div className="flex flex-col h-full">
      {/* Items */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-8 text-gray-500">
          <ShoppingBag className="h-12 w-12 text-gray-300" />
          <p className="text-sm font-medium">Tu carrito está vacío</p>
          <Link
            href="/productos"
            onClick={onClose}
            className="text-sm text-primary hover:underline"
          >
            Ver productos
          </Link>
        </div>
      ) : (
        <>
          <ul className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {previewItems.map((item) => (
              <CartLineItem
                key={item.id}
                item={item}
                variant="compact"
                isUpdating={isItemUpdating(item.id)}
                formatPrice={formatPrice}
                onNavigate={onClose}
                onDecrease={() => handleQuantityChange(item.id, item.quantity - 1)}
                onIncrease={() => handleQuantityChange(item.id, item.quantity + 1)}
                onRemove={() => removeItem(item.id)}
              />
            ))}

            {remaining > 0 && (
              <li className="py-2 text-center text-xs text-gray-500">
                +{remaining} producto{remaining > 1 ? "s" : ""} más
              </li>
            )}
          </ul>

          {/* Footer */}
          <div className="border-t border-gray-200 pt-3 mt-3 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Subtotal</span>
              <div className="text-right">
                <p className="font-bold text-gray-900 leading-tight">{formatPrice(subtotal)}</p>
                <p className="text-xs text-gray-500">{formatBsPrice(subtotal)}</p>
              </div>
            </div>

            <Link
              href="/carrito"
              onClick={onClose}
              className="block w-full bg-primary hover:bg-primary/90 text-primary-foreground text-center font-semibold py-3 rounded-lg transition-colors text-sm"
            >
              Ver carrito completo
            </Link>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className={className}>
      {/* ── Desktop: hover dropdown ─────────────────────────────────── */}
      <div
        className="relative hidden md:block"
        onMouseEnter={openDropdown}
        onMouseLeave={scheduleClose}
      >
        <Link
          href="/carrito"
          className="p-2 text-gray-700 hover:text-primary transition-colors flex items-center"
          aria-label={`Carrito (${totalItems} productos)`}
        >
          <CartBadge />
        </Link>

        {dropdownOpen && (
          <div
            className="absolute right-0 top-full pt-1 z-50"
            onMouseEnter={openDropdown}
            onMouseLeave={scheduleClose}
          >
            <div className="w-80 bg-white rounded-xl shadow-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 text-sm">
                  Carrito{" "}
                  {totalItems > 0 && (
                    <span className="text-gray-500 font-normal">({totalItems})</span>
                  )}
                </h3>
              </div>
              <CartContent onClose={() => setDropdownOpen(false)} />
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile: Sheet (drawer desde la derecha) ─────────────────── */}
      <Sheet>
        <SheetTrigger asChild>
          <button
            className="md:hidden p-2 text-gray-700 hover:text-primary transition-colors"
            aria-label={`Carrito (${totalItems} productos)`}
          >
            <CartBadge />
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-sm p-0 flex flex-col">
          <SheetHeader className="px-4 pt-4 pb-0 border-b border-gray-100 shrink-0">
            <SheetTitle className="text-left text-base font-semibold">
              Carrito{" "}
              {totalItems > 0 && (
                <span className="text-gray-500 font-normal text-sm">({totalItems})</span>
              )}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <CartContent />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
