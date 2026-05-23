import dayjs from "dayjs";
import invariant from "invariant";
import React, { useEffect } from "react";
import { DateRange } from "react-day-picker";
import { FieldValues } from "react-hook-form";
import { twMerge } from "tailwind-merge";

import { FormCalendarRangeInputProps as Props } from "./FormCalendarRangeInput.types";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { FormField, FormItem, FormLabel } from "@/components/ui/form";

const FormCalendarRangeInput = <TSchema extends FieldValues>(
  props: Props<TSchema>
) => {
  const { className, description, control, messageClassName, ...rest } = props;
  const { labelClassName, descriptionClassName, label, ...rest2 } = rest;
  const { placeholder, name, defaultValue, disabled, ...rest3 } = rest2;
  const { wrapperClassName, onValueChange } = rest3;

  return (
    <FormField
      control={control}
      name={name}
      defaultValue={defaultValue}
      render={fieldProps => {
        const { field } = fieldProps;
        const changeHandler = (date: DateRange) => {
          const { from, to } = date;
          invariant(from, "Start date is required");
          const start_date = from.toISOString();
          const fallback = dayjs(start_date).endOf("day").toISOString();
          const end_date = to?.toISOString() ?? fallback;
          const value = `${start_date}|${end_date}`;
          field.onChange(value);
          onValueChange?.(value);
        };
        const dates = field.value?.split("|") ?? [];
        const fallbackStart = dayjs().startOf("day").toISOString();
        const fallbackEnd = dayjs().endOf("day").toISOString();
        const start_date = dates[0] ? dates[0] : fallbackStart;
        const end_date = dates[1] ? dates[1] : fallbackEnd;
        const key = `${start_date}|${end_date}`;

        const fieldOnChange = field.onChange;
        // Hack to trigger onChange when the component is mounted
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
          fieldOnChange(key);
        }, [fieldOnChange, key]);

        return (
          <FormItem
            className={twMerge("flex w-full flex-col", wrapperClassName)}
          >
            <FormLabel
              className={twMerge(
                "FormCalendarRangeInputLabel leading-6",
                labelClassName
              )}
            >
              {label}
            </FormLabel>
            <FormControl>
              <DateRangePicker
                key={key}
                className={twMerge("FormCalendarRangeInput", className)}
                initialDateFrom={start_date}
                initialDateTo={end_date}
                onUpdate={({ range }) => changeHandler(range)}
              />
            </FormControl>
            <FormDescription
              className={twMerge(
                "FormCalendarRangeInputDescription",
                descriptionClassName
              )}
            >
              {description}
            </FormDescription>
            <FormMessage className={twMerge("FormError", messageClassName)} />
          </FormItem>
        );
      }}
    />
  );
};

export default FormCalendarRangeInput;
