"use client";

import { ProductFiltersProps } from "./ProductFilters.types";

const priceRanges = [
  { value: "", label: "Todos los precios" },
  { value: "0-40", label: "Menos de $40" },
  { value: "40-60", label: "$40 - $60" },
  { value: "60-80", label: "$60 - $80" },
  { value: "80-999999", label: "Más de $80" },
];

const featuredOptions = [
  { value: "", label: "Todos" },
  { value: "featured", label: "Solo destacados" },
];

const stockOptions = [
  { value: "", label: "Todos" },
  { value: "in-stock", label: "Solo en stock" },
];

const sortOptions = [
  { value: "featured", label: "Más relevantes" },
  { value: "price-asc", label: "Precio: Menor a Mayor" },
  { value: "price-desc", label: "Precio: Mayor a Menor" },
  { value: "newest", label: "Más nuevos" },
  { value: "name", label: "Nombre A-Z" },
];

const selectClassName =
  "border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-ring min-w-[160px]";

export default function ProductFilters({
  className = "",
  filters,
  onFiltersChange,
  categories,
}: ProductFiltersProps) {
  const update = (patch: Partial<ProductFiltersProps["filters"]>) => {
    onFiltersChange({ ...filters, ...patch });
  };

  return (
    <div
      className={`flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center ${className}`}
    >
      <select
        className={selectClassName}
        value={filters.categoryId}
        onChange={(e) => update({ categoryId: e.target.value })}
        aria-label="Categoría"
      >
        <option value="">Todas las categorías</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>

      <select
        className={selectClassName}
        value={filters.priceRange}
        onChange={(e) => update({ priceRange: e.target.value })}
        aria-label="Rango de precio"
      >
        {priceRanges.map((range) => (
          <option key={range.value || "all"} value={range.value}>
            {range.label}
          </option>
        ))}
      </select>

      <select
        className={selectClassName}
        value={filters.featured}
        onChange={(e) => update({ featured: e.target.value })}
        aria-label="Destacados"
      >
        {featuredOptions.map((option) => (
          <option key={option.value || "all"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select
        className={selectClassName}
        value={filters.stock}
        onChange={(e) => update({ stock: e.target.value })}
        aria-label="Disponibilidad"
      >
        {stockOptions.map((option) => (
          <option key={option.value || "all"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select
        className={`${selectClassName} sm:ml-auto`}
        value={filters.sort}
        onChange={(e) =>
          update({ sort: e.target.value as ProductFiltersProps["filters"]["sort"] })
        }
        aria-label="Ordenar por"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
