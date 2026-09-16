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
          "inline-flex items-center gap-2 rounded bg-stock-out px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-stock-out-foreground",
          className
        )}
      >
        <Flame className="h-4 w-4 shrink-0 fill-stock-out-foreground text-stock-out-foreground" aria-hidden />
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
        "inline-flex items-center gap-1 rounded text-xs font-semibold uppercase",
        compact ? "px-[4px] py-[1px]" : "px-1.5 py-1",
        isLastUnit
          ? "bg-stock-last text-stock-last-foreground"
          : "bg-stock-low text-stock-low-foreground",
        className
      )}
    >
      <Flame
        className={cn(
          "h-3 w-3 shrink-0 scale-110",
          isLastUnit
            ? "fill-stock-last-foreground text-stock-last-foreground"
            : "fill-stock-low-foreground text-stock-low-foreground"
        )}
        aria-hidden
      />
      <span>{label}</span>
    </span>
  );
}
