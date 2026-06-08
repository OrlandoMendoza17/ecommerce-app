interface Product extends Omit<Tables<"products">, "images" | "tags" | "attributes"> {
  images: string[];
  tags: string[];
  attributes: Record<string, unknown>;
  /** Oldest active variant — populated by storefront product queries */
  stock_quantity?: number;
  default_variant_id?: string;
}
