'use client'

import { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { FieldValues, useFormContext } from 'react-hook-form'
import { Upload, X, FileImage } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FormFileInputProps as Props } from './FormFileInput.types'
import { downloadFiles } from '@/utils/supabase/storage/downloadFiles'

const defaultPlaceholder = "Arrastra archivos aquí o haz clic para seleccionar"
const defaultAccept = { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] }

const FormFileInput = <TFieldValues extends FieldValues>(props: Props<TFieldValues>) => {
  const { handleDrop } = props;
  const { folder, bucket } = props;
  const { name, placeholder, label, description, className } = props;
  let { maxFiles, maxSize, accept, disabled, multiple } = props;

  const { setValue, getValues } = useFormContext()

  maxFiles = maxFiles || 5;
  maxSize = maxSize ?? 1 * 1024 * 1024; // 1MB default
  accept = accept || defaultAccept;
  disabled = disabled || false;
  multiple = multiple || true;

  // placeholder: undefined → default, string → ese texto, null → no renderizar
  const showPlaceholder = placeholder !== null;
  const placeholderText = placeholder === undefined ? defaultPlaceholder : placeholder;

  // Estado local para manejar los archivos
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    (async () => {
      // Solo intentar descargar archivos si folder está definido
      if (folder) {
        try {
          const files = await downloadFiles(folder, bucket);
          setFiles(files);
          setValue(name as any, files);
        } catch (error) {
          console.error('Error downloading existing files:', error);
          // Si hay error, mantener el estado de archivos vacío
          setFiles([]);
        }
      }
    })()
  }, [folder, bucket, setValue, name])

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (handleDrop) {
      handleDrop(acceptedFiles, rejectedFiles);
      const next = getValues(name as any);
      const nextFiles = Array.isArray(next) ? next : [];
      setFiles(nextFiles);
      return;
    }
    const updatedFiles = [...files, ...acceptedFiles];
    setValue(name as any, updatedFiles)
    // Actualizar estado local y formulario
    setFiles(updatedFiles);
  }, [handleDrop, files, setValue, getValues, name])

  const removeFile = useCallback((indexToRemove: number) => {
    const newFiles = files.filter((_, index) => index !== indexToRemove);
    setFiles(newFiles);
    setValue(name as any, newFiles)
  }, [files, setValue, name])

  const options = { onDrop, accept, maxFiles, maxSize, multiple, disabled }
  const dropzone = useDropzone(options)

  const { getRootProps, getInputProps } = dropzone
  const { isDragActive, isDragReject, fileRejections } = dropzone

  return (
    <div className={cn("space-y-2", className)}>
      {/* Label */}
      <span className="text-sm font-medium block">
        {label}
      </span>

      {/* Dropzone Area */}
      <div
        {...getRootProps()}
        className={cn(
          files.length === 0 ? "p-8" : "px-4 pb-2 pt-1",
          "border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors bg-white",
          isDragActive && !isDragReject && "border-primary bg-primary/5",
          isDragReject && "border-destructive bg-destructive/5",
          disabled && "cursor-not-allowed opacity-50",
          "hover:border-primary/50 hover:bg-muted/50"
        )}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center space-y-4">
          {isDragActive ? (
            <div className="flex flex-col items-center space-y-2">
              <Upload className="h-8 w-8 text-primary" />
              <p className="text-sm text-primary font-medium">
                {isDragReject ? "Archivos no válidos" : "Suelta los archivos aquí"}
              </p>
            </div>
          ) : (
            files.length === 0 ?
              <div className="flex flex-col items-center space-y-2">

                {showPlaceholder && (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{placeholderText}</p>
                  </>
                )}
                <Button type="button" variant="outline" size="sm" disabled={disabled}>
                  Seleccionar Archivos
                </Button>
              </div> : null
          )}

          {/* File previews */}
          {files && files.length > 0 && (
            <div className="w-full mt-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {files.map((file: File, index: number) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-lg border border-border overflow-hidden bg-muted">
                      {file.type.startsWith('image/') ? (
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileImage className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeFile(index)
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {file.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      {/* File rejection errors */}
      {fileRejections.length > 0 && (
        <div className="text-sm text-destructive">
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name}>
              <strong>{file.name}:</strong> {errors.map(e => e.message).join(', ')}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FormFileInput
