// TableRowCopyIdAction types and interfaces
import { TableRowCopyValueActionProps } from "../TableRowCopyValueAction/TableRowCopyValueAction.types";

// Component Props
type ExcludedProps = Omit<TableRowCopyValueActionProps, "name" | "value">;
export interface TableRowCopyIdActionProps extends ExcludedProps {
  id: string;
}
