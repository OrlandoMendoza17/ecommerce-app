"use client";

import { Suspense, useState } from "react";
import BrandLogo from "@/components/widgets/BrandLogo/BrandLogo";
import CartHover from "@/components/widgets/CartHover/CartHover";
import HeaderExchangeRate from "@/components/widgets/Header/HeaderExchangeRate";
import HeaderSearchBar from "@/components/widgets/Header/HeaderSearchBar";
import { cn } from "@/lib/utils";
import { HeaderProps } from "./Header.types";
import HeaderMobileMenu from "./HeaderMobileMenu";
import StoreUserMenu from "./StoreUserMenu";

export default function Header({ className = "" }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

          <Suspense fallback={null}>
            <HeaderSearchBar className="hidden min-w-0 flex-1 max-w-xl md:block" />
          </Suspense>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            <HeaderExchangeRate className="max-[425px]:hidden" />
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

        <div className="border-t border-gray-100 pb-3 pt-2 md:hidden">
          <Suspense fallback={null}>
            <HeaderSearchBar />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
