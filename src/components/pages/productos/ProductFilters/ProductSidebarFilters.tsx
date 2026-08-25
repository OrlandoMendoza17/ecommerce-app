"use client";

import { ChevronRight } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ProductSidebarFiltersProps } from "./ProductFilters.types";
import ProductActiveFilterChips from "./ProductActiveFilterChips";

const PRICE_PRESETS = [
  { min: 10, max: 32 },
  { min: 32, max: 50 },
] as const;

function formatPresetLabel(min: number, max: number) {
  return `US$ ${min} a US$ ${max}`;
}

function isPresetActive(
  filters: ProductSidebarFiltersProps["filters"],
  min: number,
  max: number
) {
  return filters.priceMin === String(min) && filters.priceMax === String(max);
}

function formatResultCount(count: number) {
  const formatted = count.toLocaleString("es-VE");
  return count === 1 ? `${formatted} resultado` : `${formatted} resultados`;
}

export default function ProductSidebarFilters({
  className = "",
  filters,
  onFiltersChange,
  categories,
  brands,
  resultCount = 0,
  isResultCountLoading = false,
}: ProductSidebarFiltersProps) {
  const [priceMin, setPriceMin] = useState(filters.priceMin);
  const [priceMax, setPriceMax] = useState(filters.priceMax);

  useEffect(() => {
    setPriceMin(filters.priceMin);
    setPriceMax(filters.priceMax);
  }, [filters.priceMin, filters.priceMax]);

  const applyPrice = (min: string, max: string) => {
    onFiltersChange({
      ...filters,
      priceMin: min,
      priceMax: max,
    });
  };

  const handlePresetClick = (min: number, max: number) => {
    const minStr = String(min);
    const maxStr = String(max);
    if (isPresetActive(filters, min, max)) {
      applyPrice("", "");
      return;
    }
    applyPrice(minStr, maxStr);
  };

  const handleCustomPriceSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    applyPrice(priceMin.trim(), priceMax.trim());
  };

  const handleCategoryClick = (categoryId: string) => {
    const nextId = filters.categoryId === categoryId ? "" : categoryId;
    onFiltersChange({ ...filters, categoryId: nextId });
  };

  const handleBrandClick = (brandId: string) => {
    const nextId = filters.brandId === brandId ? "" : brandId;
    onFiltersChange({ ...filters, brandId: nextId });
  };

  const searchQuery = filters.search.trim();

  return (
    <aside className={cn("space-y-8", className)}>
      {searchQuery ? (
        <section className="space-y-1 mb-4">
          <h1 className="text-2xl font-semibold leading-tight text-gray-900">
            {searchQuery}
          </h1>
          <p className="text-sm text-gray-500">
            {isResultCountLoading
              ? "Buscando…"
              : formatResultCount(resultCount)}
          </p>
        </section>
      ) : null}

      <ProductActiveFilterChips
        filters={filters}
        categories={categories}
        brands={brands}
        onFiltersChange={onFiltersChange}
      />

      {categories.length > 0 ? (
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Categorías</h2>
          <ul className="space-y-2">
            {categories.map((category) => {
              const isActive = filters.categoryId === category.id;
              return (
                <li key={category.id}>
                  <button
                    type="button"
                    onClick={() => handleCategoryClick(category.id)}
                    className={cn(
                      "text-left text-sm transition-colors hover:text-primary",
                      isActive
                        ? "font-semibold text-primary"
                        : "text-gray-600"
                    )}
                  >
                    {category.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {brands.length > 0 ? (
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Marcas</h2>
          <ul className="space-y-2">
            {brands.map((brand) => {
              const isActive = filters.brandId === brand.id;
              return (
                <li key={brand.id}>
                  <button
                    type="button"
                    onClick={() => handleBrandClick(brand.id)}
                    className={cn(
                      "text-left text-sm transition-colors hover:text-primary",
                      isActive
                        ? "font-semibold text-primary"
                        : "text-gray-600"
                    )}
                  >
                    {brand.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="text-sm">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Precio</h2>

        <ul className="space-y-2 mb-4">
          {PRICE_PRESETS.map((preset) => {
            const active = isPresetActive(filters, preset.min, preset.max);
            return (
              <li key={`${preset.min}-${preset.max}`}>
                <button
                  type="button"
                  onClick={() => handlePresetClick(preset.min, preset.max)}
                  className={cn(
                    "text-left text-sm transition-colors hover:text-primary",
                    active ? "font-semibold text-primary" : "text-gray-600"
                  )}
                >
                  {formatPresetLabel(preset.min, preset.max)}
                </button>
              </li>
            );
          })}
        </ul>

        <form
          onSubmit={handleCustomPriceSubmit}
          className="flex items-center gap-1.5 text-sm"
        >
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            placeholder="Mínimo"
            value={priceMin}
            onChange={(event) => setPriceMin(event.target.value)}
            className="h-6 w-[90px] shrink-0 px-2 py-1 bg-white text-sm md:text-sm shadow-none"
            aria-label="Precio mínimo"
          />
          <span className="text-gray-400 shrink-0 text-sm" aria-hidden>
            —
          </span>
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            placeholder="Máximo"
            value={priceMax}
            onChange={(event) => setPriceMax(event.target.value)}
            className="h-6 w-[90px] shrink-0 px-2 py-1 bg-white text-sm md:text-sm shadow-none"
            aria-label="Precio máximo"
          />
          <button
            type="submit"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary p-0 text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            aria-label="Aplicar rango de precio"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </form>
      </section>
    </aside>
  );
}
