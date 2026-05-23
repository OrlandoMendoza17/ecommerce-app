import { QueryStatus } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";

export interface TablePaginationValues {
  count: number | undefined;
  page: number;
  size: number;
  from: number;
  to: number;
  onPageChange: (newPage: number, size: number) => void;
  onSizeChange: (newPageSize: number) => void;
}

export type TableFiltersType = "text" | "boolean" | "select" | "date";

export interface TableFiltersFilter {
  label: string;
  value: string;
  type?: TableFiltersType;
  options?: string[];
}

export type TableFiltersFilterWithOperator = TableFiltersFilter & {
  operator: string;
};

export type TableFiltersAppliedFilter = Pick<
  TableFiltersFilter,
  "label" | "value"
> & {
  operator: string;
};

export type TableFiltersColumn = Omit<TableFiltersFilter, "value">;

export interface TableFiltersValues {
  filters: TableFiltersFilter[];
  columns: TableFiltersColumn[];
  applyFilters: (filters: TableFiltersFilterWithOperator[]) => void;
  applyFilter: (filter: TableFiltersFilterWithOperator) => void;
  removeFilter: (label: string) => void;
  clearFilters: () => void;
  getAppliedFilters: () => TableFiltersAppliedFilter[];
  getAppliedFilter: (label: string) => TableFiltersAppliedFilter | undefined;
}

export interface TableSearchValues {
  q: string;
  input: string;
  onChange: (value: string) => void;
  onReset: () => void;
}

export interface TableProps<TData, TValue> {
  className?: string;
  columns: ColumnDef<TData, TValue>[];
  data: TData[] | undefined;
  status: QueryStatus;
  pagination?: TablePaginationValues;
  filters?: TableFiltersValues;
  search?: TableSearchValues;
  searchPlaceholder?: string;
  noResults?: React.ReactNode;
}

export interface TableSkeletonProps {
  columns: number;
  rows: number;
  className?: string;
  ref?: React.RefObject<HTMLDivElement | null>;
}
