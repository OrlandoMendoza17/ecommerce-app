import type { ProductFiltersState } from "../ProductFilters/ProductFilters.types";
import { normalizeProduct } from "@/utils/products/parseProductImages";

export const defaultProductFilters: ProductFiltersState = {
  categoryId: "",
  priceRange: "",
  featured: "",
  stock: "",
  sort: "featured",
};

function matchesPriceRange(price: number, range: string): boolean {
  if (!range) return true;
  const [min, max] = range.split("-").map(Number);
  return price >= min && price <= max;
}

export function filterAndSortProducts(
  products: Product[],
  filters: ProductFiltersState
): Product[] {
  let result = products.map(normalizeProduct);

  if (filters.priceRange) {
    result = result.filter((p) => matchesPriceRange(p.price, filters.priceRange));
  }

  if (filters.stock === "in-stock") {
    result = result.filter((p) => p.stock_quantity > 0);
  }

  switch (filters.sort) {
    case "price-asc":
      result.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      result.sort((a, b) => b.price - a.price);
      break;
    case "newest":
      result.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      break;
    case "name":
      result.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "featured":
    default:
      result.sort((a, b) => {
        if (a.is_featured !== b.is_featured) {
          return a.is_featured ? -1 : 1;
        }
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
      break;
  }

  return result;
}

export function buildProductsQueryInput(filters: ProductFiltersState) {
  return {
    is_active: true as const,
    ...(filters.categoryId ? { category_id: filters.categoryId } : {}),
    ...(filters.featured === "featured" ? { is_featured: true as const } : {}),
  };
}
