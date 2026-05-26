"use client"

import { User, ChevronsUpDown, Gauge, Power } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem } from "@/components/ui/dropdown-menu"

// import { SidebarMenuButton } from "@/components/ui/sidebar"
import { trpc } from "@/config/trpc.config"
import { useAuth } from "@/hooks/useAuth"
import { authAPI } from "@/lib/auth"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getFullName, getName } from "@/lib/transformers/profile"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { MdOutlineAdminPanelSettings } from "react-icons/md"

interface Props {
  details?: boolean
  homeNav?: boolean
}

export function NavUser({ details = true, homeNav = false }: Props) {
  const { user, rendered } = useAuth()

  if (!rendered) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg">
        <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
        {details && (
          <>
            <div className="grid flex-1 min-w-0 gap-1">
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="size-4 shrink-0 rounded-sm" />
          </>
        )}
      </div>
    )
  }

  return (
    <>
      {!user &&
        <>
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/auth/login"
              className={`text-sm font-medium ${homeNav ? "text-muted-foreground hover:text-foreground" : "text-white"} transition-colors`}
            >
              Iniciar sesión
            </Link>
            <Button asChild size="lg" className={`${homeNav ? "" : "border border-white"}`}>
              <Link href="/auth/signup">Registrarse</Link>
            </Button>
          </div>
          <div className="md:hidden">
            <Button asChild size="lg" className={`${homeNav ? "" : "border border-white"}`}>
              <Link href="/auth/login">Acceder</Link>
            </Button>
          </div>
        </>
      }
      {
        user &&
        <UserDropdown user={user} details={details} />
      }
    </>
  )
}

const UserDropdown = ({ user, details = true }: { user: SupabaseUser; details?: boolean }) => {
  const router = useRouter()

  const profileMeta = user.user_metadata as Partial<Profile>

  const { data: profile } = trpc.profiles.getById.useQuery(
    { id: user?.id || "" },
    { enabled: !!user?.id }
  )

  const isPlatformAdmin = true

  const handleLogout = async () => {
    await authAPI.logout();
    router.push("/auth/login")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="text-inherit cursor-pointer">
        <div
          className="text-inherit flex items-center gap-2 p-2 rounded-lg data-[state=open]:bg-muted-foreground/20"
        >
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage className="object-cover bg-white" src={profileMeta.avatar_url || ""} alt={profileMeta.email || ""} />
            <AvatarFallback className="rounded-lg">
              <User className="h-5 w-5 text-black" />
            </AvatarFallback>
          </Avatar>
          {details &&
            <>
              <div className="grid flex-1 text-left text-base leading-tight">
                <span className="truncate font-medium">{getName(profileMeta)}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </>
          }
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
        side="bottom"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage className="object-cover" src={user.user_metadata.avatar_url} alt={user.email} />
              <AvatarFallback className="rounded-lg">
                <User className="h-5 w-5 text-black" />
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{getFullName(profileMeta)}</span>
              <span className="truncate text-xs">{user.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isPlatformAdmin && (
          <>
            <Link href="/admin">
              <DropdownMenuItem>
                <MdOutlineAdminPanelSettings className="mr-2 size-4" />
                <span>Panel plataforma</span>
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuGroup>
          <Link href="/user">
            <DropdownMenuItem>
              <User className="mr-2 size-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        {/* <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Settings className="mr-2 size-4" />
            <span>Configuración</span>
          </DropdownMenuItem>
        </DropdownMenuGroup> */}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <Power className="mr-2 size-4" />
          <span>Cerrar sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}