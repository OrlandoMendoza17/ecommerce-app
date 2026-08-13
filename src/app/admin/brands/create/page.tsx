"use client";

import BrandsForm from "@/components/pages/admin/brands/BrandsForm/BrandsForm";
import FeatureHeader from "@/components/widgets/FeatureHeader/FeatureHeader";

export default function CreateBrandPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-muted min-h-screen">
      <div className="grid grid-cols-[minmax(0,900px)] justify-center">
        <FeatureHeader
          title="Crear marca"
          description="Registra una nueva marca de productos"
          backUrl="/admin/brands"
        />
        <BrandsForm />
      </div>
    </div>
  );
}
