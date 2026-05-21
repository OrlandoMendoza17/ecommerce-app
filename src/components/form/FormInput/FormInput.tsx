import React from "react";
import { FieldValues } from "react-hook-form";
import { twMerge } from "tailwind-merge";

import { FormInputProps as Props } from "./FormInput.types";
import { FormField } from "@/components/ui/form";
import { FormDescription, FormMessage } from "@/components/ui/form";
import { FormControl, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const FormInput = <TSchema extends FieldValues>(props: Props<TSchema>) => {
  const { className, description, control, messageClassName, ...rest } = props;
  const { labelClassName, descriptionClassName, label, name, ...rest2 } = rest;
  const { wrapperClassName, disabled, ...rest3 } = rest2;

  return (
    <FormField
      control={control}
      name={name}
      defaultValue={rest3.defaultValue}
      render={fieldProps => {
        const { field, formState: { errors } } = fieldProps;
        const sanitizedValue = field.value ?? "";

        const focusHandler = (e: React.FocusEvent<HTMLInputElement>) => {
          rest3.onFocus?.(e);
          if (e.target.type === "number") e.target.select();
        };

        const blurHandler = (e: React.FocusEvent<HTMLInputElement>) => {
          rest3.onBlur?.(e);
          field.onBlur();
        };

        const changeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
          rest3.onChange?.(e);
          field.onChange(e);
        };

        return (
          <FormItem className={twMerge("FormInputWrapper", wrapperClassName)}>
            <FormLabel
              className={twMerge("FormInputLabel", labelClassName)}
              htmlFor={name}
            >
              {label}
            </FormLabel>
            <FormControl>
              <Input
                id={name}
                className={twMerge("FormInput text-sm", className)}
                {...rest3}
                {...field}
                disabled={disabled ?? field.disabled}
                value={sanitizedValue}
                onFocus={focusHandler}
                onBlur={blurHandler}
                onChange={changeHandler}
              />
            </FormControl>
            {
              (description && !errors[name]) && (
                <>
                  {rest3.type !== "hidden" ? (
                    <FormDescription
                      className={twMerge(
                        "FormInputDescription",
                        descriptionClassName
                      )}
                    >
                      {description}
                    </FormDescription>
                  ) : null}
                </>
              )
            }
            <FormMessage className={twMerge("FormError", messageClassName)} />
          </FormItem>
        );
      }}
    />
  );
};

export default FormInput;
