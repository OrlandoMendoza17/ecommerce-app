import { QueryStatus } from "@tanstack/react-query";
import { TableFilterOption, TableFiltersColumn } from "./Table.types";

export const getTableStatus = (
  countStatus: QueryStatus,
  queryStatus: QueryStatus
): QueryStatus => {
  if (countStatus === "error" || queryStatus === "error") return "error";
  if (countStatus === "pending" || queryStatus === "pending") return "pending";
  return "success";
};

export function normalizeFilterOption(
  option: string | TableFilterOption
): TableFilterOption {
  return typeof option === "string" ? { value: option, label: option } : option;
}

export function getFilterDisplayLabel(column: TableFiltersColumn): string {
  return column.displayLabel ?? column.label;
}
