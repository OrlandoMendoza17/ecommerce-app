import ProductCard from "@/components/shared/ProductCard/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductGridProps } from "./ProductGrid.types";

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

export default function ProductGrid({
  className = "",
  products,
  isLoading = false,
  isError = false,
}: ProductGridProps) {
  return (
    <div className={className}>
      <div className="mb-6">
        <p className="text-sm text-gray-600">
          Mostrando{" "}
          <span className="font-semibold">{isLoading ? "..." : products.length}</span>{" "}
          productos
        </p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-800">
            No se pudieron cargar los productos. Intenta de nuevo más tarde.
          </p>
        </div>
      )}

      {!isLoading && !isError && products.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-600">No se encontraron productos con los filtros seleccionados.</p>
        </div>
      )}

      {!isLoading && !isError && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
