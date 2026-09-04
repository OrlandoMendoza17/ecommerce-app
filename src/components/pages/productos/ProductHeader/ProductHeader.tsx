import ProductStockBadge from "@/components/pages/productos/ProductStockBadge/ProductStockBadge";
import { Star } from "lucide-react";

export interface ProductHeaderProps {
  name: string;
  stockQuantity?: number;
  lowStockThreshold?: number;
  averageRating?: number;
  reviewCount?: number;
  className?: string;
}

export default function ProductHeader({
  name,
  stockQuantity,
  lowStockThreshold,
  averageRating = 0,
  reviewCount = 0,
  className = "",
}: ProductHeaderProps) {
  return (
    <div className={className}>
      <h1 className="text-base lg:text-[1.375rem] font-bold text-gray-900">
        {name}
      </h1>

      {stockQuantity !== undefined && (
        <div className="hidden lg:block">
          <ProductStockBadge
            quantity={stockQuantity}
            lowStockThreshold={lowStockThreshold}
          />
        </div>
      )}

      {reviewCount > 0 && (
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`size-[15px] ${i < Math.floor(averageRating)
                  ? "text-primary fill-primary"
                  : "text-gray-300"
                  }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600">
            {averageRating.toFixed(1)} ({reviewCount} reseña
            {reviewCount !== 1 ? "s" : ""})
          </span>
        </div>
      )}
    </div>
  );
}
