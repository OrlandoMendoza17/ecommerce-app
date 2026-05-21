"use client";

import QuickStatsGrid from "@/components/pages/admin/home/QuickStatsGrid/QuickStatsGrid";
import AdminQuickActions from "@/components/pages/admin/home/AdminQuickActions/AdminQuickActions";
import FeatureHeader from "@/components/widgets/FeatureHeader/FeatureHeader";

export default function Page() {
  return (
    <div className="flex flex-1 flex-col gap-6 pt-0">
      {/* Título */}
      <FeatureHeader
        title="Panel de Administración"
        description="Gestiona tu ecommerce"
        className="mb-0!"
      />

      {/* Estadísticas rápidas */}
      <QuickStatsGrid />

      {/* Grid de 2 columnas para eventos y equipos */}
      <div className="grid gap-6 lg:grid-cols-2">
      </div>

      {/* Actividad reciente */}

      {/* Accesos rápidos */}
      <AdminQuickActions />
    </div>
  );
}
