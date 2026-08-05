"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { trpc } from "@/config/trpc.config";
import ProductCard from "@/components/shared/ProductCard/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { normalizeProduct } from "@/utils/products/parseProductImages";
import { FeaturedProductsProps } from "./FeaturedProducts.types";

function ProductCardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden p-4 space-y-4">
      <Skeleton className="aspect-square w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export default function FeaturedProducts({ className = "" }: FeaturedProductsProps) {
  const { data, isLoading, isError } = trpc.products.select.useQuery({
    is_active: true,
    is_featured: true,
  });

  const products = (data ?? []).map(normalizeProduct);

  return (
    <section className={`py-16 lg:py-24 ${className}`}>
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-10 px-4 sm:px-6 lg:px-8">
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Productos Destacados
            </h2>
            <p className="text-gray-600">
              Las piezas más populares de nuestra colección
            </p>
          </div>
          <Link
            href="/productos"
            className="hidden sm:flex items-center text-primary hover:text-primary/80 font-medium group"
          >
            <span>Ver todo</span>
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {isLoading && (
          <div className="grid grid-cols-2 lg:grid-cols-4 sm:gap-6px-4 sm:px-6 lg:px-8">
            {Array.from({ length: 4 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        )}

        {isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm text-red-800">
              No se pudieron cargar los productos destacados. Intenta de nuevo más tarde.
            </p>
          </div>
        )}

        {!isLoading && !isError && products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No hay productos destacados por el momento.</p>
          </div>
        )}

        {!isLoading && !isError && products.length > 0 && (
          // <div className="grid grid-cols-2 lg:grid-cols-4 sm:gap-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 sm:gap-6px-4 sm:px-6 lg:px-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        <div className="mt-8 sm:hidden text-center">
          <Link
            href="/productos"
            className="inline-flex items-center text-primary hover:text-primary/80 font-medium group"
          >
            <span>Ver todos los productos</span>
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
