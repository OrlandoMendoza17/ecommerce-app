import { Control, FieldPath, FieldValues } from 'react-hook-form'

export interface FormCheckboxProps<TFieldValues extends FieldValues = FieldValues> {
  control: Control<TFieldValues>
  name: FieldPath<TFieldValues>
  label: string | React.ReactNode
  description?: string
  disabled?: boolean
  className?: string
  required?: boolean
  messageClassName?: string
}
