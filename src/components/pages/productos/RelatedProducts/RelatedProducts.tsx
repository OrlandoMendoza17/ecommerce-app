"use client";

import { trpc } from "@/config/trpc.config";
import ProductCard from "@/components/shared/ProductCard/ProductCard";
import { RelatedProductsProps } from "./RelatedProducts.types";

export default function RelatedProducts({
  categoryId,
  excludeProductId,
  className = "",
}: RelatedProductsProps) {
  const { data: products = [] } = trpc.products.select.useQuery(
    {
      is_active: true,
      category_id: categoryId ?? undefined,
    },
    {
      select: (data) =>
        data
          .filter((p) => p.id !== excludeProductId)
          .slice(0, 4),
    }
  );

  if (products.length === 0) return null;

  return (
    <section className={`py-12 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-8">
          Productos Relacionados
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
