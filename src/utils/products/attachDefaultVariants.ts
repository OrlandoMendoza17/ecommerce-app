import type { SupabaseClient } from "@supabase/supabase-js";
import { getAvailableStock } from "@/lib/cart-stock";
import { parseProductImages } from "@/utils/products/parseProductImages";

type DefaultVariantRow = {
  id: string;
  product_id: string;
  price: number;
  compare_at_price: number;
  stock_quantity: number;
  reserved_quantity: number;
  allow_backorder: boolean;
  images: unknown;
};

export async function attachDefaultVariantsToProducts(
  supabase: SupabaseClient,
  products: Product[]
): Promise<Product[]> {
  if (products.length === 0) return products;

  const productIds = products.map((p) => p.id);
  const { data, error } = await supabase
    .from("product_variants")
    .select("id, product_id, price, compare_at_price, stock_quantity, reserved_quantity, allow_backorder, images")
    .in("product_id", productIds)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  const defaultByProductId = new Map<string, DefaultVariantRow>();
  for (const row of data ?? []) {
    if (!defaultByProductId.has(row.product_id)) {
      defaultByProductId.set(row.product_id, row as DefaultVariantRow);
    }
  }

  return products.map((product) => {
    const variant = defaultByProductId.get(product.id);
    if (!variant) return product;

    const variantImages = parseProductImages(variant.images);

    return {
      ...product,
      price: variant.price,
      compare_at_price: variant.compare_at_price,
      images: variantImages.length > 0 ? variantImages : product.images,
      stock_quantity: getAvailableStock(
        variant.stock_quantity,
        variant.reserved_quantity ?? 0,
        variant.allow_backorder
      ),
      default_variant_id: variant.id,
    };
  });
}
