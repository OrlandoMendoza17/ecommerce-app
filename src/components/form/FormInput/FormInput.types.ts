import { ComponentProps } from "react";
import { FieldValues } from "react-hook-form";
import { FormFieldProps } from "@/types/form.types";

export interface FormInputProps<TSchema extends FieldValues>
  extends FormFieldProps<TSchema>,
  Omit<ComponentProps<"input">, "name" | "defaultChecked" | "defaultValue"> { }
