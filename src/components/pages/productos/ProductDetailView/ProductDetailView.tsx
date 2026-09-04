"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { trpc } from "@/config/trpc.config";
import ProductGallery from "@/components/pages/productos/ProductGallery/ProductGallery";
import ProductHeader from "@/components/pages/productos/ProductHeader/ProductHeader";
import ProductInfo from "@/components/pages/productos/ProductInfo/ProductInfo";
import ProductDescription from "@/components/pages/productos/ProductDescription/ProductDescription";
import RelatedProducts from "@/components/pages/productos/RelatedProducts/RelatedProducts";
import ProductDetailSkeleton from "./ProductDetailSkeleton";
import type { ProductDetailViewProps } from "./ProductDetailView.types";

const CONDITION_LABELS: Record<string, string> = {
  new: "Nuevo",
  used: "Usado",
  refurbished: "Reacondicionado",
};

function buildSpecifications(
  product: Product,
  brandName?: string | null
): Record<string, string> {
  const specs: Record<string, string> = {};

  if (brandName) specs["Marca"] = brandName;
  if (product.condition) specs["Condición"] = CONDITION_LABELS[product.condition] ?? product.condition;
  if (product.is_digital) specs["Tipo"] = "Producto digital";
  if ((product.tags ?? []).length > 0) specs["Etiquetas"] = product.tags.join(", ");

  const attrs = product.attributes ?? {};
  for (const [key, value] of Object.entries(attrs)) {
    if (value !== null && value !== undefined && value !== "") {
      specs[key] = String(value);
    }
  }

  return specs;
}

export default function ProductDetailView({ slug }: ProductDetailViewProps) {
  const { data: product, isLoading, isError } = trpc.products.getBySlug.useQuery(
    { slug },
    { staleTime: 60_000 }
  );

  const { data: category } = trpc.categories.getById.useQuery(
    { id: product?.category_id! },
    { enabled: !!product?.category_id }
  );

  const { data: brand } = trpc.brands.getById.useQuery(
    { id: product?.brand_id! },
    { enabled: !!product?.brand_id }
  );

  const { data: stats } = trpc.products.getStats.useQuery(
    { id: product!.id },
    { enabled: !!product?.id }
  );

  if (isLoading) return <ProductDetailSkeleton />;

  if (isError || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 px-4">
        <h1 className="text-2xl font-bold text-gray-900">Producto no encontrado</h1>
        <p className="text-gray-600 text-center">
          El producto que buscas no existe o no está disponible.
        </p>
        <Link
          href="/productos"
          className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Ver todos los productos
        </Link>
      </div>
    );
  }

  const specifications = buildSpecifications(product, brand?.name);
  const hasSpecifications = Object.keys(specifications).length > 0;
  const galleryImages =
    product.images.length > 0
      ? product.images
      : ["/placeholder-product.jpg"];

  return (
    <div className="bg-gray-100">
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-200 hidden md:block">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm flex-wrap gap-y-1">
            <Link href="/" className="text-gray-600 hover:text-primary transition-colors">
              Inicio
            </Link>
            <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
            <Link href="/productos" className="text-gray-600 hover:text-primary transition-colors">
              Productos
            </Link>
            {category && (
              <>
                <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                <Link
                  href={`/productos?categoria=${category.slug}`}
                  className="text-gray-600 hover:text-primary transition-colors"
                >
                  {category.name}
                </Link>
              </>
            )}
            <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
            <span className="text-gray-900 font-medium line-clamp-1">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Product Detail */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-12 bg-white rounded-lg my-8 shadow-md">
        <ProductHeader
          name={product.name}
          averageRating={stats?.average_rating}
          reviewCount={stats?.total_reviews}
          className="mb-6 lg:hidden"
        />

        <div className="lg:grid lg:grid-cols-[7fr_3fr] lg:gap-8 xl:gap-12">
          {/* Columna izquierda: galería + descripción (desktop) */}
          <div className="min-w-0 lg:col-start-1 lg:row-start-1 b">
            <ProductGallery images={galleryImages} productName={product.name} />
          </div>

          {/* Columna derecha: info sticky (solo desktop); top = altura header (65px) + respiro */}
          <div className="mt-8 lg:mt-0 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-[calc(65px+1rem)] lg:self-start">
            <ProductInfo
              product={product}
              averageRating={stats?.average_rating}
              reviewCount={stats?.total_reviews}
            />
          </div>

          {/* Descripción debajo de galería en desktop; después de info en mobile */}
          {(product.description || hasSpecifications) && (
            <div className="mt-8 lg:mt-0 lg:col-start-1 lg:row-start-2">
              <ProductDescription
                embedded
                description={product.description || ""}
                specifications={hasSpecifications ? specifications : undefined}
              />
            </div>
          )}
        </div>
      </div>

      {/* Related products */}
      <RelatedProducts
        categoryId={product.category_id}
        excludeProductId={product.id}
      />
    </div>
  );
}
