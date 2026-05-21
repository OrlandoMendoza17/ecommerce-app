import { ReactNode } from "react";
import { Control, FieldValues, Path, PathValue } from "react-hook-form";

export interface FormFieldProps<TSchema extends FieldValues> {
  className?: string;
  labelClassName?: string;
  messageClassName?: string;
  descriptionClassName?: string;
  wrapperClassName?: string;
  name: Path<TSchema>;
  label: ReactNode;
  control: Control<TSchema>;
  description?: ReactNode;
  defaultValue?: PathValue<TSchema, Path<TSchema>>;
  defaultChecked?: PathValue<TSchema, Path<TSchema>>;
}
