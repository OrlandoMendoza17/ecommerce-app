"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RowSelectionState, OnChangeFn } from "@tanstack/react-table";
import {
  TableFiltersAppliedFilter,
  TableFiltersColumn,
  TableFiltersFilter,
  TableFiltersFilterWithOperator,
  TableFiltersValues,
  TablePaginationValues,
  TableSearchValues,
} from "./Table.types";

// Hook 1: useTablePagination
export const useTablePagination = (
  count: number | undefined,
  defaultSize = 10
): TablePaginationValues | undefined => {
  const [shouldUpdateURL, setShouldUpdateURL] = useState(false);
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  // Limit the page size
  const size = (() => {
    const size = parseInt(params.get("size") ?? `${defaultSize}`, 10);
    if (size < 1) return 1;
    return size;
  })();
  // Limit the page number
  const totalPages = Math.max(Math.ceil((count ?? Infinity) / size), 1);
  const page = useMemo(() => {
    const page = parseInt(params.get("page") ?? "1", 10);
    if (page > totalPages) setShouldUpdateURL(true);
    if (page > totalPages) return totalPages;
    if (page < 1) return 1;
    return page;
  }, [params, totalPages]);
  // Calculate the from and to values
  const getFromTo = (page: number, size: number) => {
    const realPage = page - 1;
    const from = realPage * size;
    const to = from + size - 1;
    return { from, to };
  };
  const [from, setFrom] = useState(() => getFromTo(page, size).from);
  const [to, setTo] = useState(() => getFromTo(page, size).to);

  const onPageChange = useCallback(
    (newPage: number, newSize: number) => {
      const { from, to } = getFromTo(newPage, newSize);
      setFrom(from);
      setTo(to);
      const newParams = new URLSearchParams(params);
      newParams.set("page", String(newPage));
      if (newSize !== size) newParams.set("size", String(newSize));
      router.replace(`${pathname}?${newParams}`, { scroll: false });
    },
    [params, pathname, router, size]
  );

  const onSizeChange = useCallback(
    (newSize: number) => {
      const newParams = new URLSearchParams(params);
      newParams.set("size", String(newSize));
      newParams.set("page", "1");
      router.replace(`${pathname}?${newParams}`, { scroll: false });
      setFrom(0);
      setTo(newSize - 1);
    },
    [params, pathname, router]
  );

  // Recalculate from & to if count changes
  useEffect(() => {
    if (!count) return;
    const { from, to } = getFromTo(page, size);
    setFrom(from);
    setTo(to);
  }, [count, page, size]);

  useEffect(() => {
    if (!shouldUpdateURL) return;
    const newParams = new URLSearchParams(params);
    newParams.set("page", totalPages.toString());
    router.replace(`${pathname}?${newParams}`, { scroll: false });
    setShouldUpdateURL(false);
  }, [params, pathname, router, totalPages, shouldUpdateURL]);

  return useMemo(() => {
    if (typeof count === "undefined") return undefined;
    return { count, page, size, from, to, onPageChange, onSizeChange };
  }, [count, from, onPageChange, onSizeChange, page, size, to]);
};

// Hook 2: useTableFilters
export const useTableFilters = (
  columns: TableFiltersColumn[],
  storageKey?: string
): TableFiltersValues => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<TableFiltersFilter[]>([]);

  // Restaurar filtros desde localStorage al montar (solo si la URL no trae filtros)
  useEffect(() => {
    if (!storageKey) return;

    const hasUrlFilters = columns.some((column) => searchParams.get(column.label));
    if (hasUrlFilters) return;

    const stored = localStorage.getItem(storageKey);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setFilters(parsed);
        // Aplicar filtros restaurados a la URL
        const params = new URLSearchParams(searchParams);
        parsed.forEach((filter: TableFiltersFilter) => {
          if (filter.label && filter.value) {
            params.set(filter.label, filter.value);
          }
        });
        router.replace(`${pathname}?${params.toString()}`);
      }
    } catch (error) {
      console.error("Error parsing stored filters:", error);
    }
  }, [storageKey]);

  // Leer filtros desde URL
  useEffect(() => {
    const urlFilters: TableFiltersFilter[] = [];

    columns.forEach((column) => {
      const value = searchParams.get(column.label);
      if (value) {
        urlFilters.push({
          label: column.label,
          value,
          type: column.type,
          options: column.options,
        });
      }
    });

    setFilters(urlFilters);

    if (storageKey) {
      if (urlFilters.length > 0) {
        localStorage.setItem(storageKey, JSON.stringify(urlFilters));
      }
    }
  }, [searchParams, columns, storageKey]);

  const applyFilters = (newFilters: TableFiltersFilterWithOperator[]) => {
    const params = new URLSearchParams(searchParams);

    // Limpiar filtros existentes
    columns.forEach((column) => {
      params.delete(column.label);
    });

    // Aplicar nuevos filtros
    newFilters.forEach((filter) => {
      const filterValue = `${filter.operator}:${filter.value}`;
      params.set(filter.label, filterValue);
    });

    // Reset a página 1
    params.set("page", "1");

    const filtersToStore = newFilters.map((f) => ({
      label: f.label,
      value: `${f.operator}:${f.value}`,
      type: f.type,
      options: f.options,
    }));

    setFilters(filtersToStore);

    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(filtersToStore));
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const applyFilter = (filter: TableFiltersFilterWithOperator) => {
    const existingFilters = getAppliedFilters();
    const filteredOut = existingFilters.filter((f) => f.label !== filter.label);
    applyFilters([...filteredOut, filter]);
  };

  const removeFilter = (label: string) => {
    const existingFilters = getAppliedFilters();
    const filtered = existingFilters.filter((f) => f.label !== label);
    applyFilters(filtered);
  };

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams);

    columns.forEach((column) => {
      params.delete(column.label);
    });

    params.set("page", "1");

    setFilters([]);

    if (storageKey) {
      localStorage.removeItem(storageKey);
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const getAppliedFilters = (): TableFiltersAppliedFilter[] => {
    return filters
      .map((filter) => {
        const [operator, ...valueParts] = filter.value.split(":");
        const value = valueParts.join(":");

        // Validar operadores permitidos
        const validOperators = ["eq", "lt", "gt", "lte", "gte", "between"];
        if (!validOperators.includes(operator)) {
          return null;
        }

        return {
          label: filter.label,
          operator,
          value,
        };
      })
      .filter((f): f is TableFiltersAppliedFilter => f !== null);
  };

  const getAppliedFilter = (
    label: string
  ): TableFiltersAppliedFilter | undefined => {
    return getAppliedFilters().find((f) => f.label === label);
  };

  return {
    filters,
    columns,
    applyFilters,
    applyFilter,
    removeFilter,
    clearFilters,
    getAppliedFilters,
    getAppliedFilter,
  };
};

// Hook 3: useTableSearch
export const useTableSearch = (): TableSearchValues => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [input, setInput] = useState(searchParams.get("q") || "");
  const q = useDeferredValue(input);

  useEffect(() => {
    setInput(searchParams.get("q") || "");
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);

    if (q) {
      params.set("q", q);
    } else {
      params.delete("q");
    }

    // Reset a página 1 cuando se busca
    params.set("page", "1");

    router.push(`${pathname}?${params.toString()}`);
  }, [q, pathname, router]);

  const onChange = (value: string) => {
    setInput(value);
  };

  const onReset = () => {
    setInput("");
  };

  return {
    q,
    input,
    onChange,
    onReset,
  };
};

// Hook 4: useTableBulkSelection
export interface UseTableBulkSelectionOptions<T> {
  data?: T[];
  totalCount?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getRowId?: (row: T) => string;
  resetTriggers?: unknown[];
}

export interface BulkTargetPayload<F = unknown> {
  id?: string;
  ids?: string[];
  allMatching?: boolean;
  filters?: F[];
  q?: string;
}

export const useTableBulkSelection = <T extends { id?: string }>(
  options: UseTableBulkSelectionOptions<T> = {}
) => {
  const {
    data,
    totalCount,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getRowId = (row: any) => row.id ?? String(row),
    resetTriggers = [],
  } = options;

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [allMatching, setAllMatching] = useState<boolean>(false);

  // Limpiar selección cuando cambian los disparadores (filtros, q, etc.)
  useEffect(() => {
    setRowSelection({});
    setAllMatching(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetTriggers);

  const selectedIds = useMemo(
    () => Object.keys(rowSelection).filter((id) => rowSelection[id]),
    [rowSelection]
  );
  const selectedCount = selectedIds.length;

  const isAllPageSelected = useMemo(() => {
    if (!data || data.length === 0) return false;
    return data.every((row) => !!rowSelection[getRowId(row)]);
  }, [data, rowSelection, getRowId]);

  const effectiveCount =
    allMatching && totalCount !== undefined ? totalCount : selectedCount;
  const hasSelection = selectedCount > 0;

  const clearSelection = useCallback(() => {
    setRowSelection({});
    setAllMatching(false);
  }, []);

  const toggleAllMatching = useCallback(() => {
    setAllMatching((prev) => !prev);
  }, []);

  const onRowSelectionChange: OnChangeFn<RowSelectionState> = useCallback(
    (updater) => {
      setRowSelection((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        if (Object.keys(next).length < Object.keys(prev).length) {
          setAllMatching(false);
        }
        return next;
      });
    },
    []
  );

  const getTargetPayload = useCallback(
    <F>(filters?: F[], q?: string): BulkTargetPayload<F> => {
      if (allMatching) {
        return {
          allMatching: true,
          filters,
          q,
        };
      }
      return {
        ids: selectedIds,
      };
    },
    [allMatching, selectedIds]
  );

  return {
    rowSelection,
    setRowSelection,
    allMatching,
    setAllMatching,
    selectedIds,
    selectedCount,
    effectiveCount,
    isAllPageSelected,
    hasSelection,
    clearSelection,
    toggleAllMatching,
    onRowSelectionChange,
    getTargetPayload,
  };
};
