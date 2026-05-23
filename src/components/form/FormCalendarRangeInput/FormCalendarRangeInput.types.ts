import { FieldValues } from "react-hook-form";
import { FormFieldProps } from "@/types/form.types";
import { CalendarProps } from "@/components/ui/calendar";

export interface FormCalendarRangeInputProps<TSchema extends FieldValues>
  extends FormFieldProps<TSchema> {
  placeholder?: string;
  disabled?: CalendarProps["disabled"];
  onValueChange?: (value: string) => void;
}
