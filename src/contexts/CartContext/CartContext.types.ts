export interface CartItemVariant {
  id: string;
  sku: string;
  price: number;
  compare_at_price: number;
  stock_quantity: number;
  images: string[];
  is_active: boolean;
  options: { type_name: string; value: string }[];
}

export interface CartItem {
  /** cart_items uuid (server) or crypto.randomUUID() (guest) */
  id: string;
  productId: string;
  variantId: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  quantity: number;
  stockQuantity: number;
  allowBackorder: boolean;
  customization_text: string;
  customization_notes: string;
  /** Etiqueta legible de las opciones seleccionadas, ej. "Color: Rojo / Talla: M" */
  optionsLabel: string;
  /** Map para lectura rápida de opciones seleccionadas */
  selectedOptions: Record<string, string>;
}

export interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** ID del ítem cuya cantidad se está actualizando en el servidor */
  updatingItemId: string | null;
  isItemUpdating: (cartItemId: string) => boolean;
  addItem: (input: AddItemInput, quantity?: number) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  clear: () => Promise<void>;
}

export interface AddItemInput {
  /** products.id */
  id: string;
  /** products.name */
  name: string;
  /** products.slug */
  slug: string;
  /** products.images (fallback si la variante no tiene) */
  images: string[];
  /** variant data */
  variantId: string;
  variantPrice: number;
  variantStockQuantity: number;
  allowBackorder?: boolean;
  variantImages?: string[];
  variantOptions?: { type_name: string; value: string }[];
  customization_text?: string;
  customization_notes?: string;
}
