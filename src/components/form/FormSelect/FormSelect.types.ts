// FormSelect types and interfaces
import { Control, FieldPath, FieldValues } from "react-hook-form";
import { SelectValueProps } from "@radix-ui/react-select";

// Component Props
export interface FormSelectProps<TFieldValues extends FieldValues = FieldValues>
  extends Omit<SelectValueProps, "defaultChecked" | "defaultValue"> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  placeholder?: string;
  description?: string;
  className?: string;
  wrapperClassName?: string;
  labelClassName?: string;
  descriptionClassName?: string;
  contentClassName?: string;
  messageClassName?: string;
  disabled?: boolean;
  onValueChange?: (value: string) => void;
}
