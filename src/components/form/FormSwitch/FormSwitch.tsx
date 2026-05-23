import React from "react";
import { FieldValues } from "react-hook-form";
import { twMerge } from "tailwind-merge";

import { FormSwitchProps as Props } from "./FormSwitch.types";
import { FormControl, FormDescription, FormField } from "@/components/ui/form";
import { FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";

const FormSwitch = <TSchema extends FieldValues>(props: Props<TSchema>) => {
  const { className, description, control, messageClassName, ...rest } = props;
  const { labelClassName, descriptionClassName, label, name, ...rest2 } = rest;
  const { wrapperClassName, onValueChange, ...rest3 } = rest2;

  return (
    <FormField
      control={control}
      name={name}
      defaultValue={rest3.defaultChecked}
      render={fieldProps => {
        const { field } = fieldProps;
        const changeHandler = (checked: boolean) => {
          field.onChange(checked);
          onValueChange?.(checked);
        };
        const checked = field.value === true || field.value === "true";
        return (
          <FormItem
            className={twMerge(
              "FormInputWrapper flex flex-col",
              wrapperClassName
            )}
          >
            <FormLabel
              className={twMerge(
                "FormInputLabel cursor-pointer leading-8",
                labelClassName
              )}
              htmlFor={name}
            >
              {label}
            </FormLabel>
            <div
              className={twMerge(
                "flex items-center gap-2",
                !label ? "mt-0!" : ""
              )}
            >
              <FormControl>
                <Switch
                  {...rest3}
                  id={name}
                  className={twMerge("FormInput", className)}
                  checked={checked}
                  onCheckedChange={changeHandler}
                />
              </FormControl>
              <FormDescription
                className={twMerge(
                  "FormInputDescription",
                  descriptionClassName
                )}
              >
                {description}
              </FormDescription>
            </div>
            <FormMessage className={twMerge("FormError", messageClassName)} />
          </FormItem>
        );
      }}
    />
  );
};

export default FormSwitch;
