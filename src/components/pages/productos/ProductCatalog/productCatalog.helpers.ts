import type { ProductFiltersState, ProductSortOption } from "../ProductFilters/ProductFilters.types";

export const defaultProductFilters: ProductFiltersState = {
  categoryId: "",
  priceMin: "",
  priceMax: "",
  featured: "",
  stock: "",
  sort: "featured",
  search: "",
};

function parsePrice(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  if (Number.isNaN(parsed) || parsed < 0) return undefined;
  return parsed;
}

export function buildStoreCatalogInput(filters: ProductFiltersState) {
  const search = filters.search.trim();
  const price_min = parsePrice(filters.priceMin);
  const price_max = parsePrice(filters.priceMax);

  return {
    q: search || undefined,
    category_id: filters.categoryId || undefined,
    is_featured: filters.featured === "featured" ? true : undefined,
    price_min,
    price_max,
    in_stock_only: filters.stock === "in-stock" ? true : undefined,
    sort: filters.sort as ProductSortOption,
  };
}
