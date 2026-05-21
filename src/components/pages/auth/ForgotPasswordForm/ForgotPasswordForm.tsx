"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { ResetPasswordFormProps as Props } from "./ForgotPasswordForm.types";
import { Form } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { ForgotPasswordForm } from "./ForgotPasswordForm.types"
import { schema } from "./ForgotPasswordForm.helpers"
import { defaultValues } from "./ForgotPasswordForm.helpers"
import FormInput from "@/components/form/FormInput/FormInput"
import { authAPI } from "@/lib/auth"
import { useToast } from "@/hooks/useToast"

export function ForgotPasswordForm({ }: Props) {
  const [loading, setLoading] = useState<boolean>(false)

  const { toast } = useToast()

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  const { control, handleSubmit } = form

  const onSubmit = handleSubmit(async (data: ForgotPasswordForm) => {
    setLoading(true)
    try {
      await authAPI.resetPasswordForEmail(data.email)
      toast({
        title: "Código de restablecimiento enviado",
        description: "Revisa tu correo electrónico para el código de restablecimiento",
        variant: "success"
      })
      setLoading(false)
    } catch (error: any) {
      console.error(error)
      toast({
        title: "Error",
        description: error.message || "Error al enviar el código de restablecimiento",
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
        <FormInput
          control={control}
          name="email"
          label="Email"
          placeholder="you@example.com"
          type="email"
        />

        {/* Send Reset Code Button */}
        <Button type="submit" className="w-full">
          {loading ?
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando código...
            </div>
            :
            "Enviar código de restablecimiento"
          }
        </Button>

        {/* Login Link */}
        <div className="text-center text-sm">
          <span className="text-muted-foreground">¿Ya tienes cuenta? </span>
          <Link
            href="/auth/login"
            className="text-primary hover:underline font-medium cursor-pointer"
          >
            Inicia sesión
          </Link>
        </div>
      </form>
    </Form>
  )
}

