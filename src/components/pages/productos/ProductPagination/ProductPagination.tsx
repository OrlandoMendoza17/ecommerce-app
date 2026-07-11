"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CatalogPaginationValues } from "@/hooks/useCatalogPagination";
import { buildPaginationItems } from "./productPagination.helpers";

interface ProductPaginationProps {
  pagination: CatalogPaginationValues;
  className?: string;
}

export default function ProductPagination({
  pagination,
  className = "",
}: ProductPaginationProps) {
  const totalPages = Math.max(Math.ceil(pagination.count / pagination.size), 1);
  const currentPage = pagination.page;
  const items = buildPaginationItems(currentPage, totalPages);

  if (totalPages <= 1) return null;

  return (
    <nav
      className={cn("flex flex-wrap items-center justify-center gap-1 py-6", className)}
      aria-label="Paginación de productos"
    >
      {currentPage > 1 ? (
        <button
          type="button"
          onClick={() => pagination.onPageChange(currentPage - 1)}
          className="mr-2 flex items-center gap-1 px-1 text-sm text-gray-500 transition-colors hover:text-primary"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Anterior
        </button>
      ) : null}

      {items.map((item, index) =>
        item.type === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            className="flex h-10 w-10 items-center justify-center text-sm text-gray-500"
            aria-hidden
          >
            …
          </span>
        ) : (
          <button
            key={item.page}
            type="button"
            onClick={() => pagination.onPageChange(item.page)}
            aria-label={`Página ${item.page}`}
            aria-current={item.page === currentPage ? "page" : undefined}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-md text-sm transition-colors",
              item.page === currentPage
                ? "border-2 border-primary bg-white font-bold text-gray-900"
                : "text-gray-500 hover:text-primary"
            )}
          >
            {item.page}
          </button>
        )
      )}

      {currentPage < totalPages ? (
        <button
          type="button"
          onClick={() => pagination.onPageChange(currentPage + 1)}
          className="ml-2 flex items-center gap-1 px-1 text-sm text-gray-500 transition-colors hover:text-primary"
        >
          Siguiente
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
    </nav>
  );
}
