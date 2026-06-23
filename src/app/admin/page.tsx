"use client";

import QuickStatsGrid from "@/components/pages/admin/home/QuickStatsGrid/QuickStatsGrid";
import AdminQuickActions from "@/components/pages/admin/home/AdminQuickActions/AdminQuickActions";
import FeatureHeader from "@/components/widgets/FeatureHeader/FeatureHeader";

export default function Page() {
  return (
    <div className="flex flex-1 flex-col gap-6 pt-0">
      <FeatureHeader
        title="Panel de Administración"
        description="Gestiona tu ecommerce"
        className="mb-0!"
      />

      <QuickStatsGrid />

      <AdminQuickActions />
    </div>
  );
}
