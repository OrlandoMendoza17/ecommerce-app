"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductFiltersState } from "./ProductFilters.types";

type CatalogBrand = Pick<Brand, "id" | "name">;

export interface ProductActiveFilterChipsProps {
  className?: string;
  filters: ProductFiltersState;
  categories: Category[];
  brands: CatalogBrand[];
  onFiltersChange: (filters: ProductFiltersState) => void;
}

function formatPriceChipLabel(priceMin: string, priceMax: string): string {
  const min = priceMin.trim();
  const max = priceMax.trim();
  if (min && max) return `US$${min} a US$${max}`;
  if (min) return `Desde US$${min}`;
  return `Hasta US$${max}`;
}

type ActiveChip = {
  key: "category" | "brand" | "price";
  label: string;
};

export default function ProductActiveFilterChips({
  className = "",
  filters,
  categories,
  brands,
  onFiltersChange,
}: ProductActiveFilterChipsProps) {
  const chips: ActiveChip[] = [];

  if (filters.categoryId) {
    const category = categories.find((item) => item.id === filters.categoryId);
    if (category) {
      chips.push({ key: "category", label: category.name });
    }
  }

  if (filters.brandId) {
    const brand = brands.find((item) => item.id === filters.brandId);
    if (brand) {
      chips.push({ key: "brand", label: brand.name });
    }
  }

  if (filters.priceMin.trim() || filters.priceMax.trim()) {
    chips.push({
      key: "price",
      label: formatPriceChipLabel(filters.priceMin, filters.priceMax),
    });
  }

  if (chips.length === 0) return null;

  const removeChip = (key: ActiveChip["key"]) => {
    if (key === "category") {
      onFiltersChange({ ...filters, categoryId: "" });
      return;
    }
    if (key === "brand") {
      onFiltersChange({ ...filters, brandId: "" });
      return;
    }
    onFiltersChange({ ...filters, priceMin: "", priceMax: "" });
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => removeChip(chip.key)}
          className="inline-flex items-center gap-0.5 border border-gray-200 bg-white px-1 py-1.5 text-xs text-gray-700 transition-colors hover:bg-gray-50"
          aria-label={`Quitar filtro ${chip.label}`}
        >
          <span>{chip.label}</span>
          <X className="h-3.5 w-3.5 text-gray-500" aria-hidden />
        </button>
      ))}
    </div>
  );
}
