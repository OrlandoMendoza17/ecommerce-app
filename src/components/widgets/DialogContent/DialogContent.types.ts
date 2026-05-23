// DialogContent types and interfaces
import { Content } from "@radix-ui/react-dialog";

// Component Props
export interface DialogContentProps
  extends React.ComponentProps<typeof Content> {
  className?: string;
  children: React.ReactNode;
  hideCloseButton?: boolean;
  onCloseClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onClose?: () => void;
  closeId?: string;
}
