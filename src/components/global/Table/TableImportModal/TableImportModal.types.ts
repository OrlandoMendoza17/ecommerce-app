import { TableImportColumnConfig } from "@/utils/import/tableImport";

export interface TableImportValidationResult<T> {
  validItems: T[];
  errors: { row: number; reason: string }[];
}

export interface TableImportExecutionResult {
  created?: number;
  updated?: number;
  errors?: { row: number; error: string }[];
}

export interface TableImportModalProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  filenamePrefix: string;
  templateColumns: TableImportColumnConfig[];
  parseAndValidate: (
    rows: Record<string, string>[]
  ) => TableImportValidationResult<T>;
  onImport: (items: T[]) => Promise<TableImportExecutionResult>;
  onSuccess?: () => void;
}
