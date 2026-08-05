import { ReactNode } from 'react'
import { Control, FieldPath, FieldValues } from 'react-hook-form'

export interface FormTextareaProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>
  name: FieldPath<TFieldValues>
  label: string
  placeholder?: string
  disabled?: boolean
  className?: string
  inputClassName?: string
  description?: ReactNode
  messageClassName?: string
  rows?: number
}
