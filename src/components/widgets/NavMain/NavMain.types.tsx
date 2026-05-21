import { IconType } from "react-icons"

export type NavItem = {
  title: string
  url: string
  icon?: IconType
  isActive?: boolean
  separator?: boolean,
  badge?: number
  items?: {
    title: string
    url: string
    separator?: boolean
  }[]
}

export type NavMainProps = {
  items: NavItem[]
}