import Link from "next/link"
import { ForgotPasswordForm } from "@/components/pages/auth/ForgotPasswordForm/ForgotPasswordForm"
import BrandLogo from "@/components/widgets/BrandLogo/BrandLogo"

export default function LoginPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="flex items-center gap-2 self-center font-medium">
          <BrandLogo />
        </Link>
        <ForgotPasswordForm />
      </div>
    </div>
  )
}
