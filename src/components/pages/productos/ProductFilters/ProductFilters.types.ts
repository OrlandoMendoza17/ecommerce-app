export type ProductSortOption =
  | "featured"
  | "price-asc"
  | "price-desc"
  | "newest"
  | "name";

export interface ProductFiltersState {
  categoryId: string;
  priceMin: string;
  priceMax: string;
  /** Solo backend; en UI siempre vacío (= todos). */
  featured: string;
  /** Solo backend; en UI siempre vacío (= todos). */
  stock: string;
  sort: ProductSortOption;
  search: string;
}

export interface ProductSidebarFiltersProps {
  className?: string;
  filters: ProductFiltersState;
  onFiltersChange: (filters: ProductFiltersState) => void;
  categories: Category[];
  resultCount?: number;
  isResultCountLoading?: boolean;
}

export interface ProductSortSelectProps {
  className?: string;
  sort: ProductSortOption;
  onSortChange: (sort: ProductSortOption) => void;
}
