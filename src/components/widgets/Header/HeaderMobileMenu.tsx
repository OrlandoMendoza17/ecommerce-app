"use client";

import Link from "next/link";
import {
  Home,
  Menu,
  Package,
  Grid3X3,
  Mail,
  ShoppingBag,
  User,
  Power,
  LogIn,
} from "lucide-react";
import { MdOutlineAdminPanelSettings } from "react-icons/md";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { trpc } from "@/config/trpc.config";
import { useAuth } from "@/hooks/useAuth";
import { authAPI } from "@/lib/auth";
import { useRouter, usePathname } from "next/navigation";
import { getFullName, getName } from "@/lib/transformers/profile";
import { cn } from "@/lib/utils";
import { isNavLinkActive, storeNavLinks } from "./Header.config";

const navIcons = {
  "/": Home,
  "/productos": Package,
  "/categorias": Grid3X3,
  "/contacto": Mail,
} as const;

interface HeaderMobileMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function HeaderMobileMenu({ open, onOpenChange }: HeaderMobileMenuProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, rendered } = useAuth();

  const { data: profile } = trpc.profiles.getById.useQuery(
    { id: user?.id || "" },
    { enabled: !!user?.id }
  );

  const profileMeta = (user?.user_metadata ?? {}) as Partial<Profile>;

  const handleLogout = async () => {
    onOpenChange(false);
    await authAPI.logout();
    router.push("/auth/login");
  };

  const close = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="lg:hidden p-2 text-gray-700 transition-colors hover:text-primary"
          aria-label="Abrir menú"
        >
          <Menu className="h-6 w-6" />
        </button>
      </SheetTrigger>

      <SheetContent side="right" className="flex h-full w-[min(100vw-2rem,320px)] flex-col p-0">
        <SheetHeader className="hidden">
          <SheetTitle className="text-base">Menú</SheetTitle>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {rendered && user ? (
            <div className="border-b px-4 py-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 rounded-lg">
                  <AvatarImage
                    src={profileMeta.avatar_url || ""}
                    alt={user.email || ""}
                    className="object-cover"
                  />
                  <AvatarFallback className="rounded-lg">
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    Hola, {getName(profileMeta)}
                  </p>
                  <p className="truncate text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
            </div>
          ) : rendered ? (
            <div className="flex flex-col gap-2 border-b px-4 py-4">
              <Button asChild variant="outline">
                <Link href="/auth/login" onClick={close}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Iniciar sesión
                </Link>
              </Button>
              <Button asChild>
                <Link href="/auth/signup" onClick={close}>
                  Crear cuenta
                </Link>
              </Button>
            </div>
          ) : null}

          <nav className="py-2">
            {storeNavLinks.map((link) => {
              const Icon = navIcons[link.href as keyof typeof navIcons];
              const active = isNavLinkActive(pathname, link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/5 text-primary"
                      : "text-gray-700 hover:bg-gray-50 hover:text-primary"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {user ? (
            <div className="border-t py-2">
              <Link
                href="/mis-compras"
                onClick={close}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-primary"
              >
                <ShoppingBag className="h-5 w-5" />
                Mis compras
              </Link>
              <Link
                href="/user"
                onClick={close}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-primary"
              >
                <User className="h-5 w-5" />
                Mi perfil
              </Link>
              {profile?.is_admin ? (
                <Link
                  href="/admin"
                  onClick={close}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-primary"
                >
                  <MdOutlineAdminPanelSettings className="h-5 w-5" />
                  Administración
                </Link>
              ) : null}
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-primary"
              >
                <Power className="h-5 w-5" />
                Cerrar sesión
              </button>
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
