export interface ProductStockBadgeProps {
  quantity: number;
  lowStockThreshold?: number;
  /** Omite "unidad/unidades" — pensado para ProductCard */
  compact?: boolean;
  className?: string;
}
