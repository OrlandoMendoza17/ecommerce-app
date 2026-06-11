"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { FiShoppingBag } from "react-icons/fi";
import { trpc } from "@/config/trpc.config";
import {
  STORE_SETTINGS_QUERY_OPTIONS,
  mapPublicStoreSettings,
} from "@/lib/store-settings";

const BrandLogo = ({ className }: { className?: string }) => {
  const { data: settings } = trpc.storeSettings.get.useQuery(
    undefined,
    STORE_SETTINGS_QUERY_OPTIONS
  );

  const { siteName, logoUrl } = mapPublicStoreSettings(settings);

  return (
    <Link href="/" className="flex items-center gap-2 self-center">
      <div className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={siteName}
            width={32}
            height={32}
            className="size-full object-contain p-0.5"
            unoptimized
          />
        ) : (
          <FiShoppingBag className="size-6" />
        )}
      </div>
      <span className={cn("text-xl font-semibold", className)}>{siteName}</span>
    </Link>
  );
};

export default BrandLogo;
