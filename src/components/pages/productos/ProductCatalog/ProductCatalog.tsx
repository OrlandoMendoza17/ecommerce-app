"use client";

import { useMemo, useState } from "react";
import { trpc } from "@/config/trpc.config";
import ProductFilters from "@/components/pages/productos/ProductFilters/ProductFilters";
import ProductGrid from "@/components/pages/productos/ProductGrid/ProductGrid";
import {
  buildProductsQueryInput,
  defaultProductFilters,
  filterAndSortProducts,
} from "./productCatalog.helpers";
import { ProductCatalogProps } from "./ProductCatalog.types";
import type { ProductFiltersState } from "../ProductFilters/ProductFilters.types";

export default function ProductCatalog({ className = "" }: ProductCatalogProps) {
  const [filters, setFilters] = useState<ProductFiltersState>(defaultProductFilters);

  const { data: categories = [] } = trpc.categories.select.useQuery({
    is_active: true,
  });

  const {
    data: products = [],
    isLoading,
    isError,
  } = trpc.products.select.useQuery(buildProductsQueryInput(filters));

  const displayedProducts = useMemo(
    () => filterAndSortProducts(products, filters),
    [products, filters]
  );

  return (
    <div className={`space-y-6 ${className}`}>
      <ProductFilters
        filters={filters}
        onFiltersChange={setFilters}
        categories={categories}
      />
      <ProductGrid
        products={displayedProducts}
        isLoading={isLoading}
        isError={isError}
      />
    </div>
  );
}
