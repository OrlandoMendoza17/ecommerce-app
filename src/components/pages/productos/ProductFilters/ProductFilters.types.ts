export type ProductSortOption =
  | "featured"
  | "price-asc"
  | "price-desc"
  | "newest"
  | "name";

export interface ProductFiltersState {
  categoryId: string;
  priceRange: string;
  featured: string;
  stock: string;
  sort: ProductSortOption;
}

export interface ProductFiltersProps {
  className?: string;
  filters: ProductFiltersState;
  onFiltersChange: (filters: ProductFiltersState) => void;
  categories: Category[];
}
