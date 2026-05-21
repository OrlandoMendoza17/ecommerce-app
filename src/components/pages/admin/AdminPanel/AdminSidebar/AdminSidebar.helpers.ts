import type { IconType } from "react-icons"
import { FiHome, FiPackage, FiShoppingCart, FiUsers, FiSettings } from "react-icons/fi"
import type { NavItem } from "@/components/widgets/NavMain/NavMain.types"
import navConfig from "./admin-nav-items.json"

const ICON_MAP: Record<string, IconType> = {
  FiHome,
  FiPackage,
  FiShoppingCart,
  FiUsers,
  FiSettings,
}

type NavItemConfig = {
  title: string
  url: string
  icon?: string
  isActive?: boolean
  separator?: boolean
  badge?: number
  items?: { title: string; url: string; separator?: boolean }[]
}

export function getAdminNavItems(): NavItem[] {
  return (navConfig as NavItemConfig[]).map((item) => ({
    title: item.title,
    url: item.url,
    icon: item.icon ? ICON_MAP[item.icon] : undefined,
    isActive: item.isActive,
    separator: item.separator,
    badge: item.badge,
    items: item.items,
  }))
}
