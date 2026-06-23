import type { NavItem } from "@/components/widgets/NavMain/NavMain.types"
import { ADMIN_ICON_MAP } from "@/components/pages/admin/admin-icons"
import navConfig from "./admin-nav-items.json"

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
    icon: item.icon ? ADMIN_ICON_MAP[item.icon] : undefined,
    isActive: item.isActive,
    separator: item.separator,
    badge: item.badge,
    items: item.items,
  }))
}
