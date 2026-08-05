"use client";

import { Package } from "lucide-react";
import { trpc } from "@/config/trpc.config";
import CategoryCard from "@/components/shared/CategoryCard/CategoryCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { CategoriesGridProps } from "./CategoriesGrid.types";

// Basado en el ancho del propio carousel (container queries), no en el viewport.
const ITEM_BASIS =
  "basis-1/2 @sm:basis-1/3 @lg:basis-1/4 @2xl:basis-1/5 @4xl:basis-1/6";

function CategoryCardSkeleton() {
  return (
    <div className={`flex flex-col items-center gap-3 ${ITEM_BASIS} shrink-0 grow-0 pl-4`}>
      <Skeleton className="aspect-square w-full rounded-lg" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

export default function CategoriesGrid({ className = "", limit }: CategoriesGridProps) {
  const { data, isLoading, isError } = trpc.categories.select.useQuery({
    is_active: true,
  });

  const categories = limit ? (data ?? []).slice(0, limit) : (data ?? []);

  if (isLoading) {
    const skeletonCount = limit ?? 6;
    return (
      <div className={`@container -ml-4 flex overflow-hidden ${className}`}>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <CategoryCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`rounded-lg border border-red-200 bg-red-50 p-6 text-center ${className}`}>
        <p className="text-sm text-red-800">
          No se pudieron cargar las categorías. Intenta de nuevo más tarde.
        </p>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className={`text-center py-16 ${className}`}>
        <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No hay categorías disponibles
        </h3>
        <p className="text-gray-600">
          Vuelve más tarde para ver nuevas categorías
        </p>
      </div>
    );
  }

  return (
    <Carousel
      opts={{ align: "start", loop: true, slidesToScroll: "auto" }}
      className={`@container ${className}`}
    >
      <CarouselContent>
        {categories.map((category) => (
          <CarouselItem key={category.id} className={ITEM_BASIS}>
            <CategoryCard category={category} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
