import { ReactNode } from 'react'

export type FeatureHeaderProps = {
  title: string
  description: string
  backUrl?: string
  previousPath?: boolean
  children?: ReactNode
  className?: string
}