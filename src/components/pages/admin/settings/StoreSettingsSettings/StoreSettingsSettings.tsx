"use client";

import { twMerge } from "tailwind-merge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/config/trpc.config";
import type { StoreSettingsSettingsProps } from "./StoreSettingsSettings.types";
import BrandSettingsCard from "./sections/BrandSettingsCard";
import SeoSettingsCard from "./sections/SeoSettingsCard";
import ContactSettingsCard from "./sections/ContactSettingsCard";
import SocialSettingsCard from "./sections/SocialSettingsCard";

function SettingsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-muted h-48 rounded-xl" />
      ))}
    </div>
  );
}

export default function StoreSettingsSettings({
  className,
}: StoreSettingsSettingsProps) {
  const { data: settings, isLoading, isError } = trpc.storeSettings.get.useQuery();

  if (isLoading) {
    return <SettingsSkeleton />;
  }

  if (isError || !settings) {
    return (
      <Card className={twMerge("StoreSettingsSettings", className)}>
        <CardHeader>
          <CardTitle>Sin configuración</CardTitle>
          <CardDescription>
            Ejecuta <code className="text-xs">scripts/seed_store_settings.sql</code> en
            Supabase y recarga esta página.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className={twMerge("StoreSettingsSettings space-y-8", className)}>
      <BrandSettingsCard settings={settings} />
      <SeoSettingsCard settings={settings} />
      <ContactSettingsCard settings={settings} />
      <SocialSettingsCard settings={settings} />
    </div>
  );
}
