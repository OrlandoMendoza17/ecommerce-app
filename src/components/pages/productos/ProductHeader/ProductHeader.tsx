import { Star } from "lucide-react";

export interface ProductHeaderProps {
  name: string;
  averageRating?: number;
  reviewCount?: number;
  className?: string;
}

const DEFAULT_RATING = 4.7;
const DEFAULT_REVIEW_COUNT = 23;

export default function ProductHeader({
  name,
  averageRating = DEFAULT_RATING,
  reviewCount = DEFAULT_REVIEW_COUNT,
  className = "",
}: ProductHeaderProps) {
  return (
    <div className={className}>
      <h1 className="text-base lg:text-[1.375rem] font-bold text-gray-900 mb-2">{name}</h1>

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
    </div>
  );
}
