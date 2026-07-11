import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductStockBadgeProps } from "./ProductStockBadge.types";

function getLowStockLabel(quantity: number, compact: boolean): string {
  if (quantity === 1) {
    const core = compact ? "ÚLTIMA" : "Última Unidad";
    return `¡${core}!`;
  }

  if (compact) {
    return `Últimas ${quantity}`;
  }

  return `Últimas ${quantity} unidades`;
}

export default function ProductStockBadge({
  quantity,
  lowStockThreshold = 5,
  compact = false,
  className = "",
}: ProductStockBadgeProps) {
  if (quantity === 0) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded bg-red-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-red-700",
          className
        )}
      >
        <Flame className="h-4 w-4 shrink-0 fill-red-600 text-red-600" aria-hidden />
        Agotado
      </span>
    );
  }

  if (quantity > lowStockThreshold) {
    return null;
  }

  const isLastUnit = quantity === 1;
  const label = getLowStockLabel(quantity, compact);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded text-xs font-semibold uppercase tracking-wide",
        compact ? "px-[4px] py-[1px]" : "px-1.5 py-1",
        isLastUnit
          ? "bg-[#FF7733] text-white"
          : "bg-[#FFE4D6] text-[#E6540B]",
        className
      )}
    >
      <Flame
        className={cn(
          "h-3 w-3 shrink-0 scale-110",
          isLastUnit ? "fill-white text-white" : "fill-[#E6540B] text-[#E6540B]"
        )}
        aria-hidden
      />
      <span>{label}</span>
    </span>
  );
}
