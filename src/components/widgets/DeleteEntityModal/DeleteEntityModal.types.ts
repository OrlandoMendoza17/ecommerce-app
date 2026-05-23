// DeleteEntityModal types and interfaces
import { ReactNode } from "react";

import { DeleteMutations } from "../Table/columns/TableRowActions/actions/TableRowDeleteAction/TableRowDeleteAction.types";

// Component Props
export interface DeleteEntityModalProps {
  className?: string;
  entity: string;
  name: string;
  id: string;
  mutation: DeleteMutations;
  onDeleteSuccess: () => void;
  children: ReactNode;
}
