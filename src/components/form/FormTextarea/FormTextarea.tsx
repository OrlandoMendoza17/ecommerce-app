'use client'

import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { FieldValues } from 'react-hook-form'
import { twMerge } from 'tailwind-merge'
import { FormTextareaProps } from './FormTextarea.types'

const FormTextarea = <TFieldValues extends FieldValues>(props: FormTextareaProps<TFieldValues>) => {

  const { control, name, label, placeholder, rows = 3, ...rest } = props
  const { disabled = false, className, inputClassName, description, messageClassName = "" } = rest

  return (
    <FormField
      control={control}
      name={name}
      render={({ field, formState: { errors } }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Textarea
              className={twMerge("text-sm bg-white", inputClassName)}
              placeholder={placeholder}
              disabled={disabled}
              rows={rows}
              {...field}
            />
          </FormControl>
          {
            description && !errors[name] &&
            <FormDescription>{description}</FormDescription>
          }
          <FormMessage className={messageClassName} />
        </FormItem>
      )}
    />
  )
}

export default FormTextarea
