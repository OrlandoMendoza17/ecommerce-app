"use client"

import { ResetPasswordForm } from "@/components/pages/auth/ResetPasswordForm/ResetPasswordForm"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import BrandLogo from "@/components/widgets/BrandLogo/BrandLogo"

export default function ResetPasswordPage() {
  const router = useRouter()
  const { user, rendered } = useAuth()
  const [isValidating, setIsValidating] = useState(true)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Monitorear cambios en el usuario y configurar timeout
  useEffect(() => {
    // Solo ejecutar cuando el contexto esté renderizado
    if (!rendered) {
      return
    }

    // Limpiar timeout anterior si existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Si hay usuario, detener la validación
    if (user) {
      setIsValidating(false)
      return
    }

    // Si no hay usuario, configurar timeout de 3 segundos
    timeoutRef.current = setTimeout(() => {
      if (!user) {
        router.push("/")
      }
    }, 3000)

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [user, rendered, router])

  if (isValidating || !user) {
    return (
      <div className="min-h-screen grid items-center justify-center bg-muted">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Validando enlace de recuperación...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10" >
      <div className="flex w-full max-w-sm flex-col gap-6">
        <BrandLogo />
        <ResetPasswordForm />
      </div>
    </div>
  )
}
