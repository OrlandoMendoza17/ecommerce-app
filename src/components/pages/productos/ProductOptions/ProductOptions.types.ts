export interface ProductOption {
  id: string;
  label: string;
  value: string;
  available: boolean;
}

export interface ProductOptionsProps {
  dimensions: ProductOption[];
  thicknesses: ProductOption[];
  className?: string;
}
