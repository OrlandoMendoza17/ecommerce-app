"use client"

import { Button } from '@/components/ui/button'
import { FaArrowLeft } from 'react-icons/fa'
import { FeatureHeaderProps as Props } from '@/components/widgets/FeatureHeader/FeatureHeader.types'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const FeatureHeader = ({ title, description, backUrl, previousPath = false, className, children }: Props) => {
  const router = useRouter()
  const renderBackButton = previousPath || backUrl;

  const handleClick = () => {
    if (previousPath) router.back();
    else if (backUrl) router.push(backUrl);
  }

  return (
    <div className={cn("md:mb-8 flex justify-between flex-col xs:flex-row xs:items-center gap-4", className)}>
      <div className="flex items-center gap-2 md:gap-4">
        {renderBackButton &&
          <Button variant="ghost" size="sm" className="pl-0!" onClick={handleClick}>
            <FaArrowLeft className="h-8! w-8!" />
          </Button>
        }
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-balance">{title}</h1>
          <p className="text-sm md:text-base text-muted-foreground text-balance">
            {description}
          </p>
        </div>
      </div>
      {
        children &&
        <div className="flex items-center">
          {children}
        </div>
      }
    </div>
  )
}

export default FeatureHeader