import type { CartItem } from "@/contexts/CartContext/CartContext.types";

export interface CartLineItemProps {
  item: CartItem;
  variant?: "compact" | "full";
  isUpdating?: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
  onRemove: () => void;
  onNavigate?: () => void;
  formatPrice: (amount: number) => string;
}
