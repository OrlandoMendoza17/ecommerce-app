export function stockExceededMessage(available: number): string {
  return available === 1
    ? "Solo hay 1 unidad disponible"
    : `Solo hay ${available} unidades disponibles`;
}

export function canIncreaseCartQuantity(
  currentQuantity: number,
  stockQuantity: number,
  allowBackorder = false
): boolean {
  if (allowBackorder) return true;
  return currentQuantity < stockQuantity;
}

export function getAvailableToAdd(
  stockQuantity: number,
  inCartQuantity: number,
  allowBackorder = false
): number {
  if (allowBackorder) return Number.POSITIVE_INFINITY;
  return Math.max(0, stockQuantity - inCartQuantity);
}
