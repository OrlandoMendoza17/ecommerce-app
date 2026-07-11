"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ProductSortOption, ProductSortSelectProps } from "./ProductFilters.types";

const sortOptions = [
  { value: "featured", label: "Más relevantes" },
  { value: "price-asc", label: "Precio: Menor a Mayor" },
  { value: "price-desc", label: "Precio: Mayor a Menor" },
  { value: "newest", label: "Más nuevos" },
  { value: "name", label: "Nombre A-Z" },
] as const;

export default function ProductSortSelect({
  className = "",
  sort,
  onSortChange,
}: ProductSortSelectProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 text-sm text-gray-900",
        className
      )}
    >
      <span className="font-semibold">Ordenar por</span>

      <Select
        value={sort}
        onValueChange={(value) => onSortChange(value as ProductSortOption)}
      >
        <SelectTrigger
          className={cn(
            "h-auto min-h-0 cursor-pointer gap-1 border-0 bg-transparent p-0 shadow-none",
            "font-normal text-gray-900 transition-colors hover:text-primary focus-visible:ring-0",
            "data-[size=default]:h-auto",
            "[&_svg]:size-4 [&_svg]:text-primary [&_svg]:opacity-100",
            "data-[state=open]:[&_svg]:rotate-180"
          )}
        >
          <SelectValue />
        </SelectTrigger>

        <SelectContent
          align="start"
          position="popper"
          sideOffset={4}
          className={cn(
            "min-w-[220px] overflow-hidden rounded-lg border-0 p-0 shadow-lg",
            "**:data-[slot=select-scroll-up-button]:hidden",
            "**:data-[slot=select-scroll-down-button]:hidden",
            "[&>div:nth-child(2)]:h-auto [&>div:nth-child(2)]:p-0"
          )}
        >
          {sortOptions.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className={cn(
                "cursor-pointer rounded-none border-b border-gray-100 py-3 pr-4 pl-4 text-sm text-gray-900 last:border-b-0",
                "focus:bg-gray-50 focus:text-gray-900",
                "data-[state=checked]:border-l-4 data-[state=checked]:border-l-primary",
                "data-[state=checked]:bg-transparent data-[state=checked]:pl-3",
                "data-[state=checked]:text-primary",
                "[&>span:first-child]:hidden"
              )}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
