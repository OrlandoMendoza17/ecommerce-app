import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import React, { useMemo } from "react";
import { SubmitHandler, useFieldArray, useForm } from "react-hook-form";
import { twMerge } from "tailwind-merge";

import TableFilterOptionsDropdown from "../TableFilterOptionsDropdown/TableFilterOptionsDropdown";
import { schema } from "./TableFiltersForm.helpers";
import { Schema } from "./TableFiltersForm.types";
import { TableFiltersFormProps as Props } from "./TableFiltersForm.types";
import FormCalendarRangeInput from "@/components/form/FormCalendarRangeInput/FormCalendarRangeInput";
import FormInput from "@/components/form/FormInput/FormInput";
import FormSelect from "@/components/form/FormSelect/FormSelect";
import FormSwitch from "@/components/form/FormSwitch/FormSwitch";
import { TableFiltersColumn } from "@/components/global/Table/Table.types";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";

const TableFiltersForm = (props: Props) => {
  const { className, values: filterValues, onApplying } = props;
  const { filters, columns } = filterValues;
  const { applyFilters } = filterValues;

  // Parse filters to separate operator from value
  const filtersWithOperators = filters.map(filter => {
    // Check if value contains an operator (format: "operator:value")
    const [possibleOperator, ...valueParts] = filter.value.split(":");
    const validOperators = ["eq", "lt", "gt", "lte", "gte", "between"];

    let operator: string;
    let cleanValue: string;

    if (validOperators.includes(possibleOperator) && valueParts.length > 0) {
      // Value has operator prefix, extract it
      operator = possibleOperator;
      cleanValue = valueParts.join(":");
    } else {
      // No operator prefix, use default based on type
      operator = filter.type === "date" ? "between" : "eq";
      cleanValue = filter.value;
    }

    return { ...filter, value: cleanValue, operator };
  });

  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: { filters: filtersWithOperators }
  });
  const { control, handleSubmit } = form;
  const formArray = useFieldArray({ control, name: "filters" });
  const { fields, append, remove } = formArray;
  const options = useMemo(() => {
    return columns.filter(column => {
      const { label } = column;
      return !fields.some(filter => filter.label === label);
    });
  }, [columns, fields]);

  const appendHandler = (option: TableFiltersColumn, operator: string) => {
    const { label, type = "text", options } = option;
    const newFilter = { label, value: "", operator, type, options };
    append(newFilter);
    onApplying?.(true);
  };

  const removeHandler = (index: number) => {
    remove(index);
    if (fields.length == 1) onApplying?.(false);
  };

  const selectHandler = (option: TableFiltersColumn) => {
    const operator = option.type === "date" ? "between" : "eq";
    appendHandler(option, operator);
  };

  const submitHandler: SubmitHandler<Schema> = async values => {
    const sanitizedValues = values.filters.map(filter => {
      const value = filter.value ?? "false";
      if (filter.type === "boolean") return { ...filter, value };
      return filter;
    });
    const validValues = sanitizedValues.filter(i => i.value).length;
    // Timeout is only to avoid flickering while closing the dropdown
    if (!validValues) setTimeout(() => onApplying?.(false), 300);
    applyFilters(values.filters);
    document.getElementById("close-dropdown")?.click();
  };

  const wrapperClassNames =
    "grid grid-cols-[96px_1fr] gap-2 items-center flex-1 *:mt-0!";
  const labelClassNames =
    "h-6 border rounded text-center flex items-center text-xs justify-center mb-0";
  const inputClassNames =
    "h-6! mt-0! text-xs focus-visible:ring-2 focus-visible:-ring-offset-4";
  const descriptionClassNames = "col-span-2 text-xs empty:hidden";
  const messageClassNames = "col-span-2 text-xs empty:hidden";
  const buttonClassNames = "h-6 text-xs px-2! py-1 cursor-pointer";

  const renderInputByType = (column: TableFiltersColumn, index: number) => {
    const { type = "text", label, options = [] } = column;
    switch (type) {
      case "text":
        return (
          <FormInput
            label={label}
            name={`filters.${index}.value`}
            placeholder="Enter a value"
            control={form.control}
            wrapperClassName={wrapperClassNames}
            className={inputClassNames}
            labelClassName={labelClassNames}
            descriptionClassName={descriptionClassNames}
            messageClassName={messageClassNames}
          />
        );
      case "select":
        return (
          <FormSelect
            label={label}
            name={`filters.${index}.value`}
            placeholder="Selecciona una opción"
            control={form.control}
            wrapperClassName={wrapperClassNames}
            className={inputClassNames}
            labelClassName={labelClassNames}
            descriptionClassName={descriptionClassNames}
            messageClassName={messageClassNames}
          >
            {options.map(option => {
              return (
                <FormSelect.Item key={option} value={option}>
                  <span className="capitalize">{option}</span>
                </FormSelect.Item>
              );
            })}
          </FormSelect>
        );
      case "boolean":
        return (
          <FormSwitch
            control={control}
            name={`filters.${index}.value`}
            label={label}
            wrapperClassName={wrapperClassNames}
            className={inputClassNames}
            labelClassName={labelClassNames}
            descriptionClassName={descriptionClassNames}
            messageClassName={messageClassNames}
          />
        );
      case "date":
        return (
          <FormCalendarRangeInput
            label={label}
            name={`filters.${index}.value`}
            control={control}
            wrapperClassName={wrapperClassNames}
            className={inputClassNames}
            labelClassName={labelClassNames}
            descriptionClassName={descriptionClassNames}
            messageClassName={messageClassNames}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Form {...form}>
      <form
        noValidate
        id="form-table-filters"
        className={twMerge(
          "TableFiltersForm flex flex-col gap-2",
          className
        )}
        onSubmit={handleSubmit(submitHandler)}
      >
        {fields.map((field, index) => {
          const { id } = field;
          return (
            <div key={id} className="flex items-center gap-2">
              {renderInputByType(field, index)}
              <Button
                className={twMerge(buttonClassNames, "px-1")}
                onClick={() => removeHandler(index)}
                variant="ghost"
              >
                <X className="size-4" />
              </Button>
            </div>
          );
        })}
        <Separator />
        <div className="flex items-center justify-between">
          <TableFilterOptionsDropdown
            className={buttonClassNames}
            options={options}
            onSelect={option => selectHandler(option)}
          />

          <Button className={buttonClassNames} variant="default" type="submit">
            Aplicar filtro
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TableFiltersForm;
