import type { SupabaseClient } from "@supabase/supabase-js";
import { getAvailableStock } from "@/lib/cart-stock";

export type StoreCatalogSort =
  | "featured"
  | "price-asc"
  | "price-desc"
  | "newest"
  | "name";

export interface StoreCatalogFilters {
  q?: string;
  category_id?: string;
  is_featured?: boolean;
  price_min?: number;
  price_max?: number;
  in_stock_only?: boolean;
  sort?: StoreCatalogSort;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ProductsQuery = any;

function applySearchFilter(query: ProductsQuery, q?: string): ProductsQuery {
  const term = q?.trim();
  if (!term) return query;

  return query.or(
    `name.ilike.%${term}%,slug.ilike.%${term}%,description.ilike.%${term}%,brand.ilike.%${term}%`
  );
}

export function applyStoreCatalogFilters(
  query: ProductsQuery,
  input: StoreCatalogFilters
): ProductsQuery {
  let next = query.eq("is_active", true);
  next = applySearchFilter(next, input.q);

  if (input.category_id) {
    next = next.eq("category_id", input.category_id);
  }

  if (input.is_featured) {
    next = next.eq("is_featured", true);
  }

  if (input.price_min !== undefined) {
    next = next.gte("price", input.price_min);
  }

  if (input.price_max !== undefined) {
    next = next.lte("price", input.price_max);
  }

  return next;
}

export function applyStoreCatalogSort(
  query: ProductsQuery,
  sort: StoreCatalogSort = "featured"
): ProductsQuery {
  switch (sort) {
    case "price-asc":
      return query.order("price", { ascending: true });
    case "price-desc":
      return query.order("price", { ascending: false });
    case "newest":
      return query.order("created_at", { ascending: false });
    case "name":
      return query.order("name", { ascending: true });
    case "featured":
    default:
      return query
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });
  }
}

/** IDs de productos cuya variante por defecto tiene stock disponible. */
export async function getInStockProductIds(
  supabase: SupabaseClient,
  candidateProductIds?: string[]
): Promise<string[]> {
  let query = supabase
    .from("product_variants")
    .select(
      "product_id, stock_quantity, reserved_quantity, allow_backorder, created_at"
    )
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (candidateProductIds && candidateProductIds.length > 0) {
    query = query.in("product_id", candidateProductIds);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const defaultVariantByProduct = new Map<
    string,
    {
      product_id: string;
      stock_quantity: number;
      reserved_quantity: number | null;
      allow_backorder: boolean;
    }
  >();

  for (const row of data ?? []) {
    if (!defaultVariantByProduct.has(row.product_id)) {
      defaultVariantByProduct.set(row.product_id, row);
    }
  }

  return [...defaultVariantByProduct.entries()]
    .filter(([, variant]) =>
      getAvailableStock(
        variant.stock_quantity,
        variant.reserved_quantity ?? 0,
        variant.allow_backorder
      ) > 0
    )
    .map(([productId]) => productId);
}

export async function countStoreCatalogProducts(
  supabase: SupabaseClient,
  input: StoreCatalogFilters
): Promise<number> {
  if (input.in_stock_only) {
    let idQuery = supabase.from("products").select("id");
    idQuery = applyStoreCatalogFilters(idQuery, input);

    const { data: candidates, error: candidatesError } = await idQuery;
    if (candidatesError) throw new Error(candidatesError.message);

    const candidateIds = (candidates ?? []).map((row: { id: string }) => row.id);
    if (candidateIds.length === 0) return 0;

    const inStockIds = await getInStockProductIds(supabase, candidateIds);
    return inStockIds.length;
  }

  let query = supabase
    .from("products")
    .select("id", { count: "exact", head: true });

  query = applyStoreCatalogFilters(query, input);

  const { count, error } = await query;
  if (error) throw new Error(error.message);

  return count ?? 0;
}

export async function listStoreCatalogProducts(
  supabase: SupabaseClient,
  input: StoreCatalogFilters & { from: number; to: number }
): Promise<Product[]> {
  if (input.in_stock_only) {
    let idQuery = supabase.from("products").select("id");
    idQuery = applyStoreCatalogFilters(idQuery, input);

    const { data: candidates, error: candidatesError } = await idQuery;
    if (candidatesError) throw new Error(candidatesError.message);

    const candidateIds = (candidates ?? []).map((row: { id: string }) => row.id);
    if (candidateIds.length === 0) return [];

    const inStockIds = await getInStockProductIds(supabase, candidateIds);
    if (inStockIds.length === 0) return [];

    let query = supabase.from("products").select("*").in("id", inStockIds);
    query = applyStoreCatalogSort(query, input.sort);
    query = query.range(input.from, input.to);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return (data ?? []) as unknown as Product[];
  }

  let query = supabase.from("products").select("*");
  query = applyStoreCatalogFilters(query, input);
  query = applyStoreCatalogSort(query, input.sort);
  query = query.range(input.from, input.to);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []) as unknown as Product[];
}
