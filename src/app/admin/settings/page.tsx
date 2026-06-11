"use client";

import FeatureHeader from "@/components/widgets/FeatureHeader/FeatureHeader";
import PaymentMethodsSettings from "@/components/pages/admin/settings/PaymentMethodsSettings/PaymentMethodsSettings";
import StoreSettingsSettings from "@/components/pages/admin/settings/StoreSettingsSettings/StoreSettingsSettings";
import StoreSettingsSectionNav from "@/components/pages/admin/settings/StoreSettingsSettings/StoreSettingsSectionNav";

export default function AdminSettingsPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-muted min-h-screen">
      <div className="grid grid-cols-[minmax(0,1300px)] justify-center">
        <FeatureHeader
          title="Configuración"
          description="Ajustes generales de la tienda"
        />
        <div className="space-y-8 px-4 pb-8 sm:px-6">
          <StoreSettingsSectionNav />
          <StoreSettingsSettings />
          <PaymentMethodsSettings id="pagos" className="scroll-mt-24" />
        </div>
      </div>
    </div>
  );
}
