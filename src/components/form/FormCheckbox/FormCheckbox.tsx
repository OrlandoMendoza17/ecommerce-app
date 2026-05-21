'use client'

import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import { FieldValues } from 'react-hook-form'
import { FormCheckboxProps } from './FormCheckbox.types'

const FormCheckbox = <TFieldValues extends FieldValues>(props: FormCheckboxProps<TFieldValues>) => {

  const { control, name, label, description, required = false, ...rest } = props
  const { disabled = false, className, messageClassName = "" } = rest

  return (
    <FormField
      control={control}
      name={name}
      render={({ field, formState: { errors } }) => (
        <FormItem className={`flex flex-row items-center space-y-0 ${className || ''}`}>
          <FormControl>
            <Checkbox
              className="m-0"
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
              required={required}
            />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </FormLabel>
            {
              description && !errors[name] &&
              <FormDescription className="text-sm text-muted-foreground">
                {description}
              </FormDescription>
            }
            <FormMessage className={messageClassName} />
          </div>
        </FormItem>
      )}
    />
  )
}

export default FormCheckbox
