"use client";

import FeatureHeader from "@/components/widgets/FeatureHeader/FeatureHeader";
import StoreSettingsSettings from "@/components/pages/admin/settings/StoreSettingsSettings/StoreSettingsSettings";
import StoreSettingsSectionNav from "@/components/pages/admin/settings/StoreSettingsSettings/StoreSettingsSectionNav";

export default function AdminSettingsPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-muted min-h-screen">
      <div className="grid grid-cols-[minmax(0,1300px)] justify-center">
        <StoreSettingsSettings />
      </div>
    </div>
  );
}
