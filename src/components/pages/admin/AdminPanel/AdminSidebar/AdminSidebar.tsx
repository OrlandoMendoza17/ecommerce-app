"use client"

import * as React from "react"
import { NavMain } from "@/components/widgets/NavMain/NavMain"
import { Sidebar, SidebarContent, SidebarHeader, SidebarRail } from "@/components/ui/sidebar"
import { getAdminNavItems } from "./AdminSidebar.helpers"
import BrandLogo from "@/components/widgets/BrandLogo/BrandLogo"

const navItems = getAdminNavItems()

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="justify-start grid py-4">
        <BrandLogo />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
