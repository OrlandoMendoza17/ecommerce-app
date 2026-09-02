import { MagicLinkForm } from "@/components/pages/auth/MagicLinkForm/MagicLinkForm"
import BrandLogo from "@/components/widgets/BrandLogo/BrandLogo"

export default function MagicLinkLoginPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <BrandLogo />
        <MagicLinkForm />
      </div>
    </div>
  )
}
