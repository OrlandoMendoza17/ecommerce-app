import { TableExportColumn } from "@/utils/export/tableExport";

export interface TableExportDropdownProps<T = Record<string, unknown>> {
  title: string;
  filenamePrefix: string;
  columns: TableExportColumn<T>[];
  onFetchData: (scope: "current" | "all") => Promise<T[]>;
  disabled?: boolean;
  className?: string;
}
