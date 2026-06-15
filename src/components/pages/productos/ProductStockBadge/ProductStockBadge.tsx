import { Flame } from "lucide-react";
import type { ProductStockBadgeProps } from "./ProductStockBadge.types";

export default function ProductStockBadge({
  quantity,
  lowStockThreshold = 5,
  className = "",
}: ProductStockBadgeProps) {
  if (quantity === 0) {
    return (
      <span
        className={`inline-flex items-center gap-2 rounded bg-red-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-red-700 ${className}`}
      >
        <Flame className="h-4 w-4 shrink-0 fill-red-600 text-red-600" aria-hidden />
        Agotado
      </span>
    );
  }

  if (quantity > lowStockThreshold) {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 items-center rounded bg-[#ff773333] px-1 py-1 text-xs font-semibold uppercase tracking-wide text-orange-600 ${className}`}
    >
      <Flame className="h-3 w-3 scale-110 shrink-0 fill-[#e6540b] text-[#e6540b]" aria-hidden />
      <span className="h-auto">Últimas {quantity} unidades</span>
    </span>
  );
}
