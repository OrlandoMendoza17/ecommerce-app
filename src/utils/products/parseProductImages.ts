export function parseProductImages(images: Product["images"] | unknown): string[] {
  if (!images || !Array.isArray(images)) return [];
  return images.filter((item): item is string => typeof item === "string");
}

export function normalizeProduct(product: Product): Product {
  return {
    ...product,
    images: parseProductImages(product.images),
  };
}
