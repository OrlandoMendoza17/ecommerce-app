/** Valores por defecto para mocks de producto (UI sin tRPC). */
export const MOCK_PRODUCT_DEFAULTS = {
  allow_backorder: false,
  category_id: null,
  cost: 0,
  created_at: "2024-01-01T00:00:00.000Z",
  description: "",
  is_active: true,
  low_stock_threshold: 5,
  meta_description: "",
  meta_title: "",
  sku: "MOCK-SKU",
  updated_at: "2024-01-01T00:00:00.000Z",
  compare_at_price: 0,
} as const;

export const MOCK_CATEGORY_DEFAULTS = {
  created_at: "2024-01-01T00:00:00.000Z",
  display_order: 0,
  is_active: true,
  updated_at: "2024-01-01T00:00:00.000Z",
  parent_id: null,
} as const;
