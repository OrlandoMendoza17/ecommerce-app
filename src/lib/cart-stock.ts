export function stockExceededMessage(available: number): string {
  return available === 1
    ? "Solo hay 1 unidad disponible"
    : `Solo hay ${available} unidades disponibles`;
}

/** Unidades vendibles = stock físico menos reservado por pedidos abiertos. */
export function getAvailableStock(
  stockQuantity: number,
  reservedQuantity = 0,
  allowBackorder = false
): number {
  if (allowBackorder) return Number.POSITIVE_INFINITY;
  return Math.max(0, stockQuantity - reservedQuantity);
}

export function canIncreaseCartQuantity(
  currentQuantity: number,
  stockQuantity: number,
  allowBackorder = false,
  reservedQuantity = 0
): boolean {
  if (allowBackorder) return true;
  return currentQuantity < getAvailableStock(stockQuantity, reservedQuantity);
}

export function getAvailableToAdd(
  stockQuantity: number,
  inCartQuantity: number,
  allowBackorder = false,
  reservedQuantity = 0
): number {
  if (allowBackorder) return Number.POSITIVE_INFINITY;
  return Math.max(0, getAvailableStock(stockQuantity, reservedQuantity) - inCartQuantity);
}
