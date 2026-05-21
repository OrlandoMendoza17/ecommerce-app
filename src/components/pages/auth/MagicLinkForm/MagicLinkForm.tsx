"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { Form } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { MagicLinkForm } from "./MagicLinkForm.types"
import { schema, defaultValues } from "./MagicLinkForm.helpers"
import FormInput from "@/components/form/FormInput/FormInput"
import { authAPI } from "@/lib/auth"
import { useToast } from "@/hooks/useToast"
import type { MagicLinkFormProps as Props } from "./MagicLinkForm.types"

export function MagicLinkForm({ }: Props) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<MagicLinkForm>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  const { control, handleSubmit } = form

  const onSubmit = handleSubmit(
    async (data: MagicLinkForm) => {
      setLoading(true)
      try {
        await authAPI.signInWithOtp(data.email)
        toast({
          title: "Enlace enviado",
          description:
            "Revisa tu correo y haz clic en el enlace para iniciar sesión.",
          variant: "success",
        })
      } catch (error: unknown) {

        toast({
          title: "Error",
          description: (error as Error).message === "email rate limit exceeded"
            ? "Has excedido el límite de envíos de enlaces mágicos. Por favor, intenta más tarde."
            : "Error al enviar el enlace.",
          variant: "error",
        })
        console.error((error as Error).message)
      } finally {
        setLoading(false)
      }
    },
  )

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-6">
        <FormInput
          control={control}
          name="email"
          label="Email"
          placeholder="tu@email.com"
          type="email"
        />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando enlace...
            </div>
          ) : (
            "Enviar enlace mágico"
          )}
        </Button>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">¿Ya tienes cuenta? </span>
          <Link
            href="/auth/login"
            className="font-medium text-primary hover:underline"
          >
            Inicia sesión con contraseña
          </Link>
        </div>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">¿No tienes cuenta? </span>
          <Link
            href="/auth/signup"
            className="font-medium text-primary hover:underline"
          >
            Regístrate aquí
          </Link>
        </div>
      </form>
    </Form>
  )
}
