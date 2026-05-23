import { SwitchProps } from "@radix-ui/react-switch";
import { FieldValues } from "react-hook-form";
import { FormFieldProps } from "@/types/form.types";

export interface FormSwitchProps<TSchema extends FieldValues>
  extends FormFieldProps<TSchema>,
  Omit<SwitchProps, "name" | "defaultChecked" | "defaultValue"> {
  onValueChange?: (value: boolean) => void;
}
