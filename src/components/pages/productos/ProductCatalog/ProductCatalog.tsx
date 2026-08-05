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
import { useCatalogPagination } from "@/hooks/useCatalogPagination";

export default function ProductCatalog({ className = "" }: ProductCatalogProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qFromUrl = searchParams.get("q") ?? "";
  const categoriaFromUrl = searchParams.get("categoria") ?? "";

  const [filters, setFilters] = useState<ProductFiltersState>(() => ({
    ...defaultProductFilters,
    search: qFromUrl,
  }));

  const { data: categories = [], isLoading: categoriesLoading } =
    trpc.categories.select.useQuery({
      is_active: true,
    });

  /** Resuelve el slug de `?categoria=` al id interno. `undefined` = aún cargando. */
  const categoryIdFromUrl = useMemo(() => {
    if (!categoriaFromUrl) return "";
    if (categoriesLoading) return undefined;
    return categories.find((category) => category.slug === categoriaFromUrl)?.id ?? "";
  }, [categoriaFromUrl, categories, categoriesLoading]);

  const categoryFilterReady = categoryIdFromUrl !== undefined;

  useEffect(() => {
    setFilters((prev) =>
      prev.search === qFromUrl ? prev : { ...prev, search: qFromUrl }
    );
  }, [qFromUrl]);

  useEffect(() => {
    if (categoryIdFromUrl === undefined) return;
    setFilters((prev) =>
      prev.categoryId === categoryIdFromUrl
        ? prev
        : { ...prev, categoryId: categoryIdFromUrl }
    );
  }, [categoryIdFromUrl]);

  const catalogInput = useMemo(() => {
    if (!categoryFilterReady) {
      return buildStoreCatalogInput(filters);
    }
    return buildStoreCatalogInput({
      ...filters,
      categoryId: categoryIdFromUrl,
    });
  }, [filters, categoryFilterReady, categoryIdFromUrl]);

  const { data: totalCount, isLoading: countLoading } =
    trpc.products.storeCatalogCount.useQuery(catalogInput, {
      enabled: categoryFilterReady,
    });

  const pagination = useCatalogPagination(
    categoryFilterReady ? totalCount : undefined
  );

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
    enabled: !!pagination && categoryFilterReady,
  });

  const replaceCatalogParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams);
      mutate(next);
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const handleFiltersChange = useCallback(
    (next: ProductFiltersState) => {
      const shouldResetPage =
        next.categoryId !== filters.categoryId ||
        next.priceMin !== filters.priceMin ||
        next.priceMax !== filters.priceMax;

      setFilters(next);

      replaceCatalogParams((params) => {
        const selectedCategory = categories.find(
          (category) => category.id === next.categoryId
        );
        if (selectedCategory) {
          params.set("categoria", selectedCategory.slug);
        } else {
          params.delete("categoria");
        }
        if (shouldResetPage) {
          params.set("page", "1");
        }
      });
    },
    [categories, filters, replaceCatalogParams]
  );

  const handleSortChange = useCallback(
    (sort: ProductSortOption) => {
      setFilters((prev) => ({ ...prev, sort }));

      if (sort !== filters.sort) {
        replaceCatalogParams((params) => {
          params.set("page", "1");
        });
      }
    },
    [filters.sort, replaceCatalogParams]
  );

  const isLoading =
    categoriesLoading ||
    !categoryFilterReady ||
    countLoading ||
    listLoading ||
    !pagination;

  return (
    <div className={className}>
      <div className="grid gap-x-8 gap-y-6 lg:grid-cols-[minmax(270px,auto)_minmax(0,1fr)] lg:items-stretch">
        <ProductSidebarFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          categories={categories}
          resultCount={totalCount ?? 0}
          isResultCountLoading={countLoading || !categoryFilterReady}
          className="hidden lg:block min-w-67.5 h-full"
        />

        <div className="min-w-0 flex flex-col gap-6">
          <ProductSidebarFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            categories={categories}
            resultCount={totalCount ?? 0}
            isResultCountLoading={countLoading || !categoryFilterReady}
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
