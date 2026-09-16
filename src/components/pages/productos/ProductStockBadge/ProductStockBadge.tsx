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
          "inline-flex items-center gap-2 rounded bg-destructive/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-destructive",
          className
        )}
      >
        <Flame className="h-4 w-4 shrink-0 fill-destructive text-destructive" aria-hidden />
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
          ? "bg-warning text-warning-foreground"
          : "bg-warning/15 text-warning",
        className
      )}
    >
      <Flame
        className={cn(
          "h-3 w-3 shrink-0 scale-110",
          isLastUnit ? "fill-warning-foreground text-warning-foreground" : "fill-warning text-warning"
        )}
        aria-hidden
      />
      <span>{label}</span>
    </span>
  );
}
