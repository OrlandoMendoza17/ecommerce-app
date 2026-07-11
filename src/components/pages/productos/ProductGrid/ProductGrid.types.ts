export interface ProductGridProps {
  className?: string;
  products: Product[];
  isLoading?: boolean;
  isError?: boolean;
  searchQuery?: string;
}
