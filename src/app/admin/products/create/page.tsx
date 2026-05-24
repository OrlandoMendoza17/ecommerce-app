"use client";

import ProductsForm from "@/components/pages/admin/products/ProductsForm/ProductsForm";
import FeatureHeader from "@/components/widgets/FeatureHeader/FeatureHeader";

export default function CreateProductPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-muted min-h-screen">
      <div className="grid grid-cols-[minmax(0,900px)] justify-center">
        <FeatureHeader
          title="Crear producto"
          description="Registra un nuevo producto en el catálogo"
          backUrl="/admin/products"
        />
        <ProductsForm />
      </div>
    </div>
  );
}
