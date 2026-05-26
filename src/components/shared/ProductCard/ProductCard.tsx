"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Star } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext/CurrencyContext";
import { ProductCardProps } from "./ProductCard.types";

export default function ProductCard({ product, className = "" }: ProductCardProps) {
  const { formatPrice } = useCurrency();

  const hasDiscount =
    product.compare_at_price > 0 && product.compare_at_price > product.price;
  const discountPercentage = hasDiscount
    ? Math.round(
        ((product.compare_at_price - product.price) / product.compare_at_price) * 100
      )
    : 0;

  const mainImage = product.images?.[0] || "/placeholder-product.jpg";
  const isOutOfStock = product.stock_quantity <= 0;

  return (
    <div
      className={`group relative bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300 ${className}`}
    >
      {product.is_featured && (
        <div className="absolute top-2 left-2 z-10 bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded-md flex items-center space-x-1">
          <Star className="h-3 w-3 fill-current" />
          <span>Destacado</span>
        </div>
      )}

      {hasDiscount && (
        <div className="absolute top-2 right-2 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md">
          -{discountPercentage}%
        </div>
      )}

      <Link href={`/productos/${product.slug}`}>
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <Image
            src={mainImage}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-xl font-bold text-gray-900">
              {formatPrice(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(product.compare_at_price)}
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="p-4 pt-0">
        <button
          type="button"
          disabled={isOutOfStock}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-md flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
          onClick={(e) => {
            e.preventDefault();
            if (isOutOfStock) return;
            console.log("Add to cart:", product.id);
          }}
        >
          <ShoppingCart className="h-4 w-4" />
          <span>{isOutOfStock ? "Agotado" : "Añadir al carrito"}</span>
        </button>
      </div>
    </div>
  );
}
