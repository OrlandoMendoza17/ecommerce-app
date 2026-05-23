import { FieldPath, FieldValues } from 'react-hook-form'
import type { FileWithPath } from 'react-dropzone'

export interface FormFileInputProps<TFieldValues extends FieldValues = FieldValues> {
  name: FieldPath<TFieldValues>
  label: string
  description?: string
  disabled?: boolean
  className?: string
  accept?: Record<string, string[]>
  maxFiles?: number
  maxSize?: number
  multiple?: boolean
  handleDrop?: (acceptedFiles: FileWithPath[], rejectedFiles: any[]) => void
  /** undefined = placeholder por defecto, string = texto a mostrar, null = no renderizar placeholder */
  placeholder?: string | null
  // Para obtener el valor actual del campo
  // Props para descargar archivos existentes de Supabase
  folder?: string
  bucket: string
}
