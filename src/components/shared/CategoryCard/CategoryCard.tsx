import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { CategoryCardProps } from "./CategoryCard.types";

export default function CategoryCard({ category, className = "" }: CategoryCardProps) {
  const categoryImage = category.image_url || "/placeholder-category.jpg";

  return (
    <Link
      href={`/productos?categoria=${category.slug}`}
      className={`group relative bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 ${className}`}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <Image
          src={categoryImage}
          alt={category.name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Category Name Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-bold text-xl mb-1">
            {category.name}
          </h3>
          {category.description && (
            <p className="text-white/90 text-sm line-clamp-2">
              {category.description}
            </p>
          )}
        </div>
      </div>

      {/* Hover Action */}
      <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300 flex items-center justify-center">
        <div className="bg-white rounded-full p-2 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-lg">
          <ArrowRight className="h-5 w-5 text-primary" />
        </div>
      </div>
    </Link>
  );
}
