import { TableFiltersColumn } from "@/components/global/Table/Table.types";

export interface TableFilterOptionsDropdownProps {
  className?: string;
  options: TableFiltersColumn[];
  onSelect: (option: TableFiltersColumn) => void;
}
