"use client";

import Link from "next/link";
import Image from "next/image";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { canIncreaseCartQuantity } from "@/lib/cart-stock";
import type { CartLineItemProps } from "./CartLineItem.types";

export default function CartLineItem({
  item,
  variant = "compact",
  isUpdating = false,
  onDecrease,
  onIncrease,
  onRemove,
  onNavigate,
  formatPrice,
}: CartLineItemProps) {
  const isCompact = variant === "compact";
  const canIncrease = canIncreaseCartQuantity(
    item.quantity,
    item.stockQuantity,
    item.allowBackorder
  );

  return (
    <li
      className={twMerge(
        "relative",
        isCompact ? "flex gap-3 py-3" : "flex gap-4 p-6"
      )}
    >
      {/* Overlay mientras se actualiza */}
      {isUpdating && (
        <div
          className="absolute inset-0 z-10 bg-white/70 pointer-events-none rounded-md"
          aria-hidden
        />
      )}

      {/* Imagen */}
      <Link
        href={`/productos/${item.slug}`}
        onClick={onNavigate}
        className="shrink-0"
      >
        <div
          className={twMerge(
            "relative rounded-md overflow-hidden bg-gray-100",
            isCompact ? "w-14 h-14" : "w-20 h-20 sm:w-24 sm:h-24 rounded-lg"
          )}
        >
          <Image
            src={item.image || "/placeholder-product.jpg"}
            alt={item.name}
            fill
            className="object-cover"
          />
        </div>
      </Link>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <div className={twMerge("flex gap-2", !isCompact && "justify-between")}>
          <Link
            href={`/productos/${item.slug}`}
            onClick={onNavigate}
            className={twMerge(
              "font-medium text-gray-900 hover:text-primary transition-colors line-clamp-2",
              isCompact ? "text-sm" : "text-sm sm:text-base"
            )}
          >
            {item.name}
          </Link>
          {!isCompact && (
            <button
              type="button"
              onClick={onRemove}
              disabled={isUpdating}
              className="shrink-0 text-gray-300 hover:text-red-500 transition-colors ml-2 disabled:opacity-40"
              aria-label="Eliminar"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {!isCompact && item.optionsLabel && (
          <p className="text-xs text-gray-500 mt-1">{item.optionsLabel}</p>
        )}

        <p
          className={twMerge(
            "font-bold text-gray-900",
            isCompact ? "text-sm mt-1" : "hidden"
          )}
        >
          {formatPrice(item.price)}
        </p>

        <div
          className={twMerge(
            "flex items-center gap-2",
            isCompact ? "mt-1" : "justify-between mt-3"
          )}
        >
          {/* Controles de cantidad */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDecrease}
              disabled={isUpdating || item.quantity <= 1}
              className={twMerge(
                "rounded border border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
                isCompact ? "w-6 h-6" : "w-8 h-8"
              )}
              aria-label="Disminuir cantidad"
            >
              <Minus className={isCompact ? "h-3 w-3" : "h-3.5 w-3.5"} />
            </button>

            {isUpdating ? (
              <div
                className={twMerge(
                  "flex items-center justify-center",
                  isCompact ? "w-5 h-6" : "w-6 h-8"
                )}
              >
                <Loader2
                  className={twMerge(
                    "animate-spin text-primary",
                    isCompact ? "h-3.5 w-3.5" : "h-4 w-4"
                  )}
                />
              </div>
            ) : (
              <span
                className={twMerge(
                  "font-medium text-center",
                  isCompact ? "text-sm w-5" : "text-sm font-semibold w-6"
                )}
              >
                {item.quantity}
              </span>
            )}

            <button
              type="button"
              onClick={onIncrease}
              disabled={isUpdating || !canIncrease}
              className={twMerge(
                "rounded border border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
                isCompact ? "w-6 h-6" : "w-8 h-8"
              )}
              aria-label="Aumentar cantidad"
            >
              <Plus className={isCompact ? "h-3 w-3" : "h-3.5 w-3.5"} />
            </button>

            {isCompact && (
              <button
                type="button"
                onClick={onRemove}
                disabled={isUpdating}
                className="ml-auto text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
                aria-label="Eliminar"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Precio total (solo en página completa) */}
          {!isCompact && (
            <div className="text-right">
              <p className="font-bold text-gray-900">
                {formatPrice(item.price * item.quantity)}
              </p>
              {item.quantity > 1 && (
                <p className="text-xs text-gray-500">
                  {formatPrice(item.price)} c/u
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
