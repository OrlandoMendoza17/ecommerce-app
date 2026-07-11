import ProductStockBadge from "@/components/pages/productos/ProductStockBadge/ProductStockBadge";

export interface ProductHeaderProps {
  name: string;
  stockQuantity?: number;
  lowStockThreshold?: number;
  className?: string;
}

export default function ProductHeader({
  name,
  stockQuantity,
  lowStockThreshold,
  className = "",
}: ProductHeaderProps) {
  return (
    <div className={className}>
      <h1 className="text-base lg:text-[1.375rem] font-bold text-gray-900 mb-4">{name}</h1>

      {stockQuantity !== undefined && (
        <div className="hidden lg:block">
          <ProductStockBadge
            quantity={stockQuantity}
            lowStockThreshold={lowStockThreshold}
          />
        </div>
      )}

      {/* Ratings UI — oculto hasta implementar reseñas reales
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-5 w-5 ${i < Math.floor(averageRating)
                ? "text-primary fill-primary"
                : "text-gray-300"
                }`}
            />
          ))}
        </div>
        <span className="text-sm text-gray-600">
          {averageRating} ({reviewCount} reseñas)
        </span>
      </div>
      */}
    </div>
  );
}
