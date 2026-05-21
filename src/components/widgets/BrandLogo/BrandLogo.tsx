import { cn } from "@/lib/utils"
import { FiShoppingBag } from "react-icons/fi";

const BrandLogo = ({ className }: { className?: string }) => {
  return (
    <div className="flex items-center gap-2 self-center">
      <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
        <FiShoppingBag className="size-6" />
      </div>
      <span className={cn("text-xl font-semibold", className)}>
        Ecommerce App
      </span>
    </div>
  )
}

export default BrandLogo;