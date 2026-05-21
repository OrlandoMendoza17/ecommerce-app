"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { ResetPasswordFormProps as Props } from "./ResetPasswordForm.types";
import { Form } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { ResetPasswordForm } from "./ResetPasswordForm.types"
import { schema } from "./ResetPasswordForm.helpers"
import { defaultValues } from "./ResetPasswordForm.helpers"
import FormInput from "@/components/form/FormInput/FormInput"
import { authAPI } from "@/lib/auth"
import { useToast } from "@/hooks/useToast"
import { useRouter } from "next/navigation"

export function ResetPasswordForm({ onSuccess }: Props) {
  const [loading, setLoading] = useState<boolean>(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const { toast } = useToast()
  const router = useRouter()

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  const { control, handleSubmit } = form

  const onSubmit = handleSubmit(async (data: ResetPasswordForm) => {
    setLoading(true)
    try {
      await authAPI.updatePassword(data.password)
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido actualizada correctamente",
        variant: "success"
      })
      setLoading(false)
      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/")
      }
    } catch (error: any) {
      console.error(error)
      toast({
        title: "Error",
        description: error.message || "Error al actualizar la contraseña",
        variant: "error"
      })
      setLoading(false)
    }
  }, (error) => {
    console.error(error)
    toast({
      title: "Error de validación",
      description: "Por favor corrige los errores en el formulario",
      variant: "error"
    })
  })

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Password Field */}
        <div className="relative">
          <FormInput
            control={control}
            name="password"
            label="Contraseña"
            placeholder="••••••••"
            type={showPassword ? "text" : "password"}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 absolute right-0.5 px-2 top-6 h-8 z-10"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>

        {/* Confirm Password Field */}
        <div className="relative">
          <FormInput
            control={control}
            name="confirmPassword"
            label="Confirmar Contraseña"
            placeholder="••••••••"
            type={showConfirmPassword ? "text" : "password"}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 absolute right-0.5 px-2 top-6 h-8 z-10"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>

        {/* Update Password Button */}
        <Button type="submit" className="w-full">
          {loading ?
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Actualizando contraseña...
            </div>
            :
            "Actualizar contraseña"
          }
        </Button>
      </form>
    </Form>
  )
}

