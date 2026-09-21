import { ReactNode } from "react";

export interface TableBulkBarProps {
  selectedCount: number;
  effectiveCount: number;
  isAllPageSelected: boolean;
  allMatching: boolean;
  totalCount?: number;
  itemLabel?: string; // Por ejemplo "productos", "categorías", "órdenes"
  onToggleAllMatching?: () => void;
  onClearSelection: () => void;
  children?: ReactNode;
}

export interface TableBulkDeleteActionProps {
  onDelete: () => Promise<void>;
  title?: string;
  description?: string;
  count?: number;
  disabled?: boolean;
}
