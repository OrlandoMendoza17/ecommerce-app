"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { trpc } from "@/config/trpc.config";
import ProductSidebarFilters from "@/components/pages/productos/ProductFilters/ProductSidebarFilters";
import ProductSortSelect from "@/components/pages/productos/ProductFilters/ProductSortSelect";
import ProductGrid from "@/components/pages/productos/ProductGrid/ProductGrid";
import ProductPagination from "@/components/pages/productos/ProductPagination/ProductPagination";
import {
  buildStoreCatalogInput,
  defaultProductFilters,
} from "./productCatalog.helpers";
import { ProductCatalogProps } from "./ProductCatalog.types";
import type {
  ProductFiltersState,
  ProductSortOption,
} from "../ProductFilters/ProductFilters.types";
import {
  resetCatalogPage,
  useCatalogPagination,
} from "@/hooks/useCatalogPagination";

export default function ProductCatalog({ className = "" }: ProductCatalogProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qFromUrl = searchParams.get("q") ?? "";

  const [filters, setFilters] = useState<ProductFiltersState>(() => ({
    ...defaultProductFilters,
    search: qFromUrl,
  }));

  useEffect(() => {
    setFilters((prev) =>
      prev.search === qFromUrl ? prev : { ...prev, search: qFromUrl }
    );
  }, [qFromUrl]);

  const { data: categories = [] } = trpc.categories.select.useQuery({
    is_active: true,
  });

  const catalogInput = useMemo(
    () => buildStoreCatalogInput(filters),
    [filters]
  );

  const { data: totalCount, isLoading: countLoading } =
    trpc.products.storeCatalogCount.useQuery(catalogInput);

  const pagination = useCatalogPagination(totalCount);

  const listInput = useMemo(
    () => ({
      ...catalogInput,
      from: pagination?.from ?? 0,
      to: pagination?.to ?? 47,
    }),
    [catalogInput, pagination?.from, pagination?.to]
  );

  const {
    data: products = [],
    isLoading: listLoading,
    isError,
  } = trpc.products.storeCatalogList.useQuery(listInput, {
    enabled: !!pagination,
  });

  const handleFiltersChange = useCallback(
    (next: ProductFiltersState) => {
      const shouldResetPage =
        next.categoryId !== filters.categoryId ||
        next.priceMin !== filters.priceMin ||
        next.priceMax !== filters.priceMax;

      setFilters(next);

      if (shouldResetPage) {
        resetCatalogPage(searchParams, pathname, router);
      }
    },
    [filters, pathname, router, searchParams]
  );

  const handleSortChange = useCallback(
    (sort: ProductSortOption) => {
      const next = { ...filters, sort };
      setFilters(next);

      if (sort !== filters.sort) {
        resetCatalogPage(searchParams, pathname, router);
      }
    },
    [filters, pathname, router, searchParams]
  );

  const isLoading = countLoading || listLoading || !pagination;

  return (
    <div className={className}>
      <div className="grid gap-x-8 gap-y-6 lg:grid-cols-[minmax(270px,auto)_minmax(0,1fr)] lg:items-stretch">
        <ProductSidebarFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          categories={categories}
          resultCount={totalCount ?? 0}
          isResultCountLoading={countLoading}
          className="hidden lg:block min-w-[270px] h-full"
        />

        <div className="min-w-0 flex flex-col gap-6">
          <ProductSidebarFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            categories={categories}
            resultCount={totalCount ?? 0}
            isResultCountLoading={countLoading}
            className="lg:hidden rounded-xl border border-gray-200 bg-white p-4"
          />

          <div className="flex justify-end">
            <ProductSortSelect
              sort={filters.sort}
              onSortChange={handleSortChange}
            />
          </div>

          <ProductGrid
            products={products}
            isLoading={isLoading}
            isError={isError}
            searchQuery={filters.search.trim()}
          />

          {pagination && pagination.count > 0 ? (
            <ProductPagination pagination={pagination} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
