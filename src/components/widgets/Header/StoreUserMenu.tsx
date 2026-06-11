"use client";

import Link from "next/link";
import {
  User,
  ChevronsUpDown,
  Power,
  ShoppingBag,
} from "lucide-react";
import { MdOutlineAdminPanelSettings } from "react-icons/md";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/config/trpc.config";
import { useAuth } from "@/hooks/useAuth";
import { authAPI } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { getFullName, getName } from "@/lib/transformers/profile";
import type { User as SupabaseUser } from "@supabase/supabase-js";

function StoreUserDropdown({ user }: { user: SupabaseUser }) {
  const router = useRouter();
  const profileMeta = user.user_metadata as Partial<Profile>;

  const { data: profile } = trpc.profiles.getById.useQuery(
    { id: user.id },
    { enabled: !!user.id }
  );

  const handleLogout = async () => {
    await authAPI.logout();
    router.push("/auth/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg p-1.5 text-gray-700 transition-colors hover:bg-gray-100 data-[state=open]:bg-gray-100"
        >
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage
              className="object-cover"
              src={profileMeta.avatar_url || ""}
              alt={profileMeta.email || ""}
            />
            <AvatarFallback className="rounded-lg">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <span className="hidden xl:inline max-w-[120px] truncate text-sm font-medium">
            {getName(profileMeta)}
          </span>
          <ChevronsUpDown className="hidden xl:block size-4 shrink-0 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="min-w-56 rounded-lg">
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-2 py-2 text-left text-sm">
            <Avatar className="h-9 w-9 rounded-lg">
              <AvatarImage
                className="object-cover"
                src={profileMeta.avatar_url || ""}
                alt={user.email || ""}
              />
              <AvatarFallback className="rounded-lg">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="grid min-w-0 flex-1 text-left leading-tight">
              <span className="truncate font-medium">{getFullName(profileMeta)}</span>
              <span className="truncate text-xs text-muted-foreground">{user.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/mis-compras">
              <ShoppingBag className="mr-2 size-4" />
              Mis compras
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/user">
              <User className="mr-2 size-4" />
              Mi perfil
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        {profile?.is_admin ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin">
                <MdOutlineAdminPanelSettings className="mr-2 size-4" />
                Panel de administración
              </Link>
            </DropdownMenuItem>
          </>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <Power className="mr-2 size-4" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function StoreUserMenu() {
  const { user, rendered } = useAuth();

  if (!rendered) {
    return <Skeleton className="h-9 w-24 rounded-lg" />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/auth/login"
          className="text-sm font-medium text-gray-600 transition-colors hover:text-primary"
        >
          Iniciar sesión
        </Link>
        <Button asChild size="sm">
          <Link href="/auth/signup">Registrarse</Link>
        </Button>
      </div>
    );
  }

  return <StoreUserDropdown user={user} />;
}
