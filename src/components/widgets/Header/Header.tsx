"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import BrandLogo from "@/components/widgets/BrandLogo/BrandLogo";
import CurrencyToggle from "@/components/widgets/CurrencyToggle/CurrencyToggle";
import CartHover from "@/components/widgets/CartHover/CartHover";
import { cn } from "@/lib/utils";
import { isNavLinkActive, storeNavLinks } from "./Header.config";
import { HeaderProps } from "./Header.types";
import HeaderMobileMenu from "./HeaderMobileMenu";
import StoreUserMenu from "./StoreUserMenu";

export default function Header({ className = "" }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-gray-200 bg-white",
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center gap-3 lg:h-16 lg:gap-6">
          <BrandLogo />

          <nav
            className="hidden min-w-0 flex-1 items-center gap-6 lg:flex"
            aria-label="Navegación principal"
          >
            {storeNavLinks.map((link) => {
              const active = isNavLinkActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-sm font-medium transition-colors whitespace-nowrap",
                    active
                      ? "text-primary"
                      : "text-gray-700 hover:text-primary"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
            <CurrencyToggle />
            <CartHover />
            <div className="hidden lg:block">
              <StoreUserMenu />
            </div>
            <HeaderMobileMenu
              open={mobileMenuOpen}
              onOpenChange={setMobileMenuOpen}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
