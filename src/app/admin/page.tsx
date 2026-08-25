"use client";

import { Suspense } from "react";
import QuickStatsGrid from "@/components/pages/admin/home/QuickStatsGrid/QuickStatsGrid";
import AdminQuickActions from "@/components/pages/admin/home/AdminQuickActions/AdminQuickActions";
import FeatureHeader from "@/components/widgets/FeatureHeader/FeatureHeader";
import PeriodSelect from "@/components/admin/PeriodSelect/PeriodSelect";

export default function Page() {
  return (
    <div className="flex flex-1 flex-col gap-6 pt-0">
      <FeatureHeader
        title="Panel de Administración"
        description="Gestiona tu ecommerce"
        className="mb-0!"
      >
        <Suspense fallback={null}>
          <PeriodSelect />
        </Suspense>
      </FeatureHeader>
      <Suspense fallback={null}>
        <QuickStatsGrid />
      </Suspense>
      <AdminQuickActions />
    </div>
  );
}
