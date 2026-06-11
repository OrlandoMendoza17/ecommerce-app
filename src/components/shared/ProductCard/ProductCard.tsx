"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useState, type MouseEvent } from "react";
import { ChevronLeft, ChevronRight, Package, Star } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext/CurrencyContext";
import { ProductCardProps } from "./ProductCard.types";

export default function ProductCard({ product, className = "" }: ProductCardProps) {
  const { formatPrice } = useCurrency();
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const hasDiscount =
    product.compare_at_price > 0 && product.compare_at_price > product.price;
  const discountPercentage = hasDiscount
    ? Math.round(
        ((product.compare_at_price - product.price) / product.compare_at_price) * 100
      )
    : 0;

  const images = product.images.filter(Boolean);
  const hasMultipleImages = images.length > 1;

  useEffect(() => {
    setActiveImageIndex(0);
  }, [product.id, images.length]);

  const goToImage = useCallback(
    (index: number) => {
      if (images.length === 0) return;
      setActiveImageIndex(((index % images.length) + images.length) % images.length);
    },
    [images.length]
  );

  const goToPrevImage = useCallback(
    (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      goToImage(activeImageIndex - 1);
    },
    [activeImageIndex, goToImage]
  );

  const goToNextImage = useCallback(
    (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      goToImage(activeImageIndex + 1);
    },
    [activeImageIndex, goToImage]
  );

  const goToImageDot = useCallback(
    (event: MouseEvent, index: number) => {
      event.preventDefault();
      event.stopPropagation();
      goToImage(index);
    },
    [goToImage]
  );

  return (
    <div
      className={`group relative bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300 ${className}`}
    >
      {product.is_featured && (
        <div className="absolute top-2 left-2 z-20 bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded-md flex items-center space-x-1">
          <Star className="h-3 w-3 fill-current" />
          <span>Destacado</span>
        </div>
      )}

      {hasDiscount && (
        <div className="absolute top-2 right-2 z-20 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md">
          -{discountPercentage}%
        </div>
      )}

      <div className="relative aspect-square overflow-hidden bg-gray-100 group/image">
        <Link href={`/productos/${product.slug}`} className="block h-full">
          {images.length > 0 ? (
            <div
              className="flex h-full transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${activeImageIndex * 100}%)` }}
            >
              {images.map((image, index) => (
                <div
                  key={`${product.id}-${index}`}
                  className="relative min-w-full shrink-0 h-full"
                >
                  <Image
                    src={image}
                    alt={`${product.name} - imagen ${index + 1}`}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="h-12 w-12 text-gray-400" aria-hidden />
              <span className="sr-only">Sin imagen disponible</span>
            </div>
          )}
        </Link>

        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={goToPrevImage}
              className="absolute left-1.5 top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-sm opacity-0 transition-opacity hover:bg-white group-hover/image:opacity-100"
              aria-label={`Imagen anterior de ${product.name}`}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={goToNextImage}
              className="absolute right-1.5 top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-sm opacity-0 transition-opacity hover:bg-white group-hover/image:opacity-100"
              aria-label={`Imagen siguiente de ${product.name}`}
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <div className="absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 gap-1">
              {images.map((_, index) => (
                <button
                  key={`${product.id}-dot-${index}`}
                  type="button"
                  onClick={(event) => goToImageDot(event, index)}
                  className={`h-1.5 rounded-full transition-all ${
                    index === activeImageIndex
                      ? "w-4 bg-primary"
                      : "w-1.5 bg-gray-400/80 hover:bg-gray-600"
                  }`}
                  aria-label={`Ver imagen ${index + 1} de ${product.name}`}
                  aria-current={index === activeImageIndex ? "true" : undefined}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <Link href={`/productos/${product.slug}`} className="block p-4">
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
      </Link>
    </div>
  );
}
