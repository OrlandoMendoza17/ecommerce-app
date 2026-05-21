"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import Link from "next/link"
import { FcGoogle } from "react-icons/fc";
import { LoginFormProps as Props } from "./LoginForm.types";
import FormInput from "@/components/form/FormInput/FormInput"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { LoginForm } from "./LoginForm.types"
import { defaultValues } from "./LoginForm.helpers"
import { schema as loginFormSchema } from "./LoginForm.helpers"
import { Form } from "@/components/ui/form"
import { authAPI } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/useToast"

export function LoginForm({ }: Props) {

  const [loading, setLoading] = useState<boolean>(false)
  const { toast } = useToast()

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginFormSchema),
    defaultValues,
  })

  const { control, handleSubmit } = form

  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)

  const onSubmit = handleSubmit(async (data: LoginForm) => {
    setLoading(true)
    try {
      const { user } = await authAPI.login(data)
      setLoading(false)
      const { is_first_login } = user?.user_metadata
      router.push(is_first_login ? "/onboarding" : "/user")

      // Verificar si faltan address o phone en user_metadata
      // const missingFields: string[] = []
      // if (!user.user_metadata?.address) {
      //   missingFields.push("dirección")
      // }
      // if (!user.user_metadata?.phone) {
      //   missingFields.push("teléfono")
      // }

      // if (missingFields.length > 0) {
      //   toast({
      //     title: "Información incompleta",
      //     description: `Recuerda completar tus ${missingFields.join(" y ")} en tu perfil`,
      //     variant: "default"
      //   })
      // }

    } catch (error: any) {
      if (error.message === "Email not confirmed") {
        toast({
          title: "Confirmación de correo requerida",
          description: "Por favor revisa tu correo el enlace de confirmación",
          variant: "default"
        })
      } else {
        toast({
          title: "Error al iniciar sesión",
          description: "Error al iniciar sesión",
          variant: "default"
        })
      }
      setLoading(false)
    }
  }, (error) => {
    console.error(error)
    toast({
      title: "Error de validación",
      description: "Por favor corrige los errores en el formulario",
      variant: "default"
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
            className="flex items-center gap-1 absolute right-1 px-2 top-7.5 h-8 z-10"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>

        {/* Remember Me and Forgot Password Link */}
        <div className="flex items-center">
          <Link
            href="/auth/forgot-password"
            className="text-sm text-primary hover:underline cursor-pointer"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        {/* Login Button */}
        <Button type="submit" className="w-full py-6 text-base">
          {loading ?
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Iniciando sesión...
            </div>
            :
            "Iniciar Sesión"
          }
        </Button>

        {googleAuthEnabled &&
          <>
            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">O</span>
              </div>
            </div>

            {/* Social Login */}
            <div className="grid">
              <Button variant="outline" type="button" className="bg-transparent">
                <FcGoogle className="h-4 w-4" />
                Continuar con Google
              </Button>
            </div>
          </>
        }
        {/* Register Link */}
        <div className="text-center text-sm">
          <span className="text-muted-foreground">¿No tienes cuenta? </span>
          <Link
            href="/auth/signup"
            className="text-primary hover:underline font-medium cursor-pointer"
          >
            Regístrate aquí
          </Link>
        </div>
      </form>
    </Form>
  )
}
