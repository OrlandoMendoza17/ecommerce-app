import ProductCard from "@/components/shared/ProductCard/ProductCard";
import { relatedProductsMock } from "@/mocks/product-detail";
import { RelatedProductsProps } from "./RelatedProducts.types";

export default function RelatedProducts({ className = "" }: RelatedProductsProps) {
  return (
    <section className={`bg-gray-50 py-12 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-8">
          Productos Relacionados
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {relatedProductsMock.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
