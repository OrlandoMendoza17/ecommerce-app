import { LoginForm } from "@/components/pages/auth/LoginForm/LoginForm"
import BrandLogo from "@/components/widgets/BrandLogo/BrandLogo"

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <BrandLogo />
        <LoginForm />
      </div>
    </div>
  )
}
