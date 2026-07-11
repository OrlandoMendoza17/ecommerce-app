import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetailSkeleton() {
  return (
    <div className="bg-white">
      {/* Breadcrumb skeleton */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12">
          {/* Gallery skeleton */}
          <div className="space-y-4">
            <Skeleton className="w-full aspect-square rounded-lg" />
            <div className="grid grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          </div>

          {/* Info skeleton */}
          <div className="mt-8 lg:mt-0 space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-10 w-1/2" />
            </div>
            {/* Rating — oculto hasta implementar reseñas reales
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-5 w-5 rounded" />
                ))}
              </div>
              <Skeleton className="h-4 w-24" />
            </div>
            */}
            {/* Price */}
            <div className="border-t border-b border-gray-200 py-6 space-y-2">
              <Skeleton className="h-12 w-40" />
            </div>
            {/* Options */}
            <div className="space-y-4">
              <Skeleton className="h-4 w-20" />
              <div className="flex gap-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-16 rounded-lg" />
                ))}
              </div>
            </div>
            {/* Qty + button */}
            <div className="space-y-3 pt-4">
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Description skeleton */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-4">
        <div className="flex gap-8 border-b pb-4">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </div>
    </div>
  );
}
