// TableRowStatus types and interfaces
import { VariantTypes } from "@/types/common.types";

// Component Props
export interface TableRowStatusProps {
  className?: string;
  status: string;
  children?: React.ReactNode;
  variant?: VariantTypes;
}
