import { FieldValues } from "react-hook-form";
import { twMerge } from "tailwind-merge";

import { FormSelectProps as Props } from "./FormSelect.types";
import { FormField, FormMessage } from "@/components/ui/form";
import { FormControl, FormDescription } from "@/components/ui/form";
import { FormItem, FormLabel } from "@/components/ui/form";
import { SelectValue, SelectLabel } from "@/components/ui/select";
import { SelectItem, SelectTrigger } from "@/components/ui/select";
import { Select, SelectContent, SelectGroup } from "@/components/ui/select";

const FormSelect = <TFieldValues extends FieldValues = FieldValues>(props: Props<TFieldValues>) => {
  const { className, description, control, messageClassName, ...rest } = props;
  const { labelClassName, descriptionClassName, label, name, ...rest2 } = rest;
  const { children, contentClassName, disabled, ...rest3 } = rest2;
  const { onValueChange, wrapperClassName, ...rest4 } = rest3;

  return (
    <FormField
      control={control}
      name={name}
      render={fieldProps => {
        const { field, formState: { errors } } = fieldProps;
        const { onChange, value } = field;
        const selectedValue = value ? value : undefined;
        const changeHandler = (value: string) => {
          onValueChange?.(value);
          onChange(value);
        };

        return (
          <FormItem className={twMerge("", wrapperClassName)}>
            <FormLabel
              className={twMerge("FormSelectLabel", labelClassName)}
            >{label}</FormLabel>
            <Select
              onValueChange={changeHandler}
              value={selectedValue}
              disabled={disabled}
            >
              <FormControl>
                <SelectTrigger
                  className={twMerge("FormSelect text-sm mb-0 w-full bg-white", className)}
                >
                  <SelectValue className="" {...rest4} />
                </SelectTrigger>
              </FormControl>
              <SelectContent
                className={twMerge(
                  "FormSelectContent max-h-[300px]",
                  contentClassName
                )}
              >
                {children}
              </SelectContent>
            </Select>
            {
              description && !errors[name] &&
              <FormDescription>{description}</FormDescription>
            }
            <FormMessage className={twMerge("FormError", messageClassName)} />
          </FormItem>
        );
      }}
    />
  );
};

FormSelect.Item = SelectItem;
FormSelect.Group = SelectGroup;
FormSelect.Label = SelectLabel;

export default FormSelect;
