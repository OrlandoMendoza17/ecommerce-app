// TableRowLinkAction types and interfaces
import { HTMLAttributeAnchorTarget } from "react";

// Component Props
export interface TableRowLinkActionProps {
  className?: string;
  href: string;
  title: string;
  target?: HTMLAttributeAnchorTarget;
  icon?: React.ReactNode;
  disabled?: boolean;
}
