"use client";

import { Package } from "lucide-react";
import { trpc } from "@/config/trpc.config";
import CategoryCard from "@/components/shared/CategoryCard/CategoryCard";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoriesGridProps } from "./CategoriesGrid.types";

function CategoryCardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <Skeleton className="h-48 w-full rounded-none" />
    </div>
  );
}

export default function CategoriesGrid({ className = "", limit }: CategoriesGridProps) {
  const { data, isLoading, isError } = trpc.categories.select.useQuery({
    is_active: true,
  });

  const categories = limit ? (data ?? []).slice(0, limit) : (data ?? []);

  if (isLoading) {
    const skeletonCount = limit ?? 8;
    return (
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}
      >
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
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}
    >
      {categories.map((category) => (
        <CategoryCard key={category.id} category={category} />
      ))}
    </div>
  );
}
