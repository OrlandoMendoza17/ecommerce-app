import Link from "next/link";
import Image from "next/image";
import { CategoryCardProps } from "./CategoryCard.types";

export default function CategoryCard({ category, className = "" }: CategoryCardProps) {
  const categoryImage = category.image_url || "/placeholder-category.jpg";
  return (
    <Link
      href={`/productos?categoria=${category.slug}`}
      className={`group flex h-full flex-col items-center gap-3 text-center ${className}`}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-50">
        <Image
          src={categoryImage}
          alt={category.name}
          fill
          sizes="(min-width: 1024px) 220px, 45vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <span className="text-sm font-semibold text-gray-900 transition-colors group-hover:text-primary sm:text-base">
        {category.name}
      </span>
    </Link>
  );
}
