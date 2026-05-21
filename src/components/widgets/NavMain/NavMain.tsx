"use client"

import { Fragment, useState } from "react"
import { ChevronRight, type LucideIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"

import { cn } from "@/lib/utils"
import { NavMainProps as Props } from "@/components/widgets/NavMain/NavMain.types"

export function NavMain({ items }: Props) {
  const pathname = usePathname()

  // Estado para rastrear qué item está abierto (usando el índice)
  const [openItem, setOpenItem] = useState<number | null>(
    items.findIndex((item) => item.isActive) !== -1
      ? items.findIndex((item) => item.isActive)
      : null
  )

  const handleOpenChange = (index: number, isOpen: boolean) => {
    if (isOpen) {
      // Si se abre un item, cerrar todos los demás (solo este queda abierto)
      setOpenItem(index)
    } else {
      // Si se cierra, permitir que se cierre
      setOpenItem(null)
    }
  }

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item, index) => {
          const Icon = item.icon
          const isActive = pathname === item.url || (item.items && item.items.some(subItem => pathname === subItem.url))
          const hasSubItems = item.items && item.items.length > 0

          // Si el item tiene subitems, renderizarlo como Collapsible
          if (hasSubItems) {
            return (
              <Fragment key={item.title}>
                <Collapsible
                  asChild
                  open={openItem === index}
                  onOpenChange={(isOpen) => handleOpenChange(index, isOpen)}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        closeOnClick={false}
                        isActive={isActive}
                        className={cn(
                          "w-full justify-start gap-3",
                          isActive &&
                          " -sidebar-accent text-sidebar-accent-foreground"
                        )}
                      >
                        {Icon && <Icon className="size-4" />}
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem, subIndex) => {
                          const isSubItemActive = pathname === subItem.url
                          return (
                            <Fragment key={subItem.title}>
                              {subItem.separator && subIndex > 0 && (
                                <SidebarSeparator className="my-1" />
                              )}
                              <SidebarMenuSubItem>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={isSubItemActive}
                                >
                                  <Link href={subItem.url}>
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            </Fragment>
                          )
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
                {item.separator && index < items.length - 1 && (
                  <SidebarSeparator className="my-2 mx-0" />
                )}
              </Fragment>
            )
          }

          // Si el item NO tiene subitems, renderizarlo como link simple
          return (
            <Fragment key={item.title}>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  className={cn(
                    "w-full justify-start gap-3",
                    isActive &&
                    " -sidebar-accent text-sidebar-accent-foreground"
                  )}
                >
                  <Link href={item.url || "#"}>
                    {Icon && <Icon className="size-4" />}
                    <span>{item.title}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {item.separator && index < items.length - 1 && (
                <SidebarSeparator className="my-2 mx-0" />
              )}
            </Fragment>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

