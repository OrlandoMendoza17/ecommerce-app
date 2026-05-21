"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import Link from "next/link"
import { FcGoogle } from "react-icons/fc"
import { RegisterFormProps as Props } from "./RegisterForm.types";
import { Form } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { RegisterForm } from "./RegisterForm.types"
import { registerFormSchema } from "./RegisterForm.helpers"
import { defaultValues } from "./RegisterForm.helpers"
import FormInput from "@/components/form/FormInput/FormInput"
import { authAPI } from "@/lib/auth"
import { useToast } from "@/hooks/useToast"
import { trpc } from "@/config/trpc.config"

export function RegisterForm({ }: Props) {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState<boolean>(false)

  const { toast, errorToast: onError } = useToast()

  const mutation = trpc.profiles.insert.useMutation({ onError })
  const { mutateAsync: insertProfile } = mutation

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerFormSchema),
    defaultValues,
  })

  const { control, handleSubmit } = form

  const onSubmit = handleSubmit(async (data: RegisterForm) => {
    setLoading(true)
    try {
      const newProfile = await authAPI.signup(data)
      await insertProfile(newProfile)
      if (newProfile) {
        toast({
          title: "Exito",
          description: "Usuario registrado correctamente, verifica tu correo para activar tu cuenta",
          variant: "success"
        })
      }
      setLoading(false)
    } catch (error: any) {
      console.error(error)
      toast({
        title: "Error",
        description: "Error al registrar el usuario",
        variant: "error"
      })
      setLoading(false)
    }
  }, (error) => {
    console.error(error)
    toast({
      title: "Error",
      description: "Por favor corrige los errores en el formulario",
      variant: "error"
    })
  })

  const googleAuthEnabled = false;

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-6">
        <FormInput
          control={control}
          name="email"
          label="Email"
          placeholder="managing@sport.com"
          type="email"
        />

        <FormInput
          control={control}
          name="phone"
          label="Teléfono"
          placeholder="+52 55 1234 5678"
          type="tel"
        />

        <FormInput
          control={control}
          name="full_name"
          label="Nombre"
          placeholder="Marcos Pérez"
        />

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
            className="flex items-center gap-1 absolute right-1 px-2 top-7.5 h-8 z-10"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>

        <Button type="submit" className="w-full py-6 text-base">
          {loading ?
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Registrando...
            </div>
            :
            "Registrarse"}
        </Button>

        {googleAuthEnabled &&
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">O</span>
              </div>
            </div>

            <div className="grid">
              <Button variant="outline" type="button" className="bg-transparent">
                <FcGoogle className="h-4 w-4" />
                Continuar con Google
              </Button>
            </div>
          </>
        }

        <div className="text-center text-sm">
          <span className="text-muted-foreground">¿Ya tienes cuenta? </span>
          <Link
            href="/auth/login"
            className="text-primary hover:underline font-medium cursor-pointer"
          >
            Inicia sesión aquí
          </Link>
        </div>
      </form>
    </Form>
  )
}
