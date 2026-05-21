"use client"

import { Search, Bell } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { NavUser } from "@/components/widgets/NavUser/NavUser"

interface HeaderProps {
  page: string
  searchPlaceholder?: string
}

export function Header({
  page,
  searchPlaceholder = "Busca un usuario..."
}: HeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-xl font-semibold">{page}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Buscador */}
        {/* <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder={searchPlaceholder}
            className="w-64 pl-9 pr-3 text-sm"
          />
        </div> */}

        {/* Botón de notificaciones */}
        {/* <Button variant="ghost" size="icon" className="relative hidden md:block">
          <Bell className="size-5" />
          <span className="absolute right-1 top-1 size-2 rounded-full bg-destructive" />
        </Button> */}

        {/* Usuario */}
        <NavUser />
      </div>
    </header>
  )
}

