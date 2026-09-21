export interface TableRowDuplicateActionProps {
  className?: string;
  title?: string;
  disabled?: boolean;
  onDuplicate?: () => Promise<unknown> | void;
  icon?: React.ReactNode;
}
