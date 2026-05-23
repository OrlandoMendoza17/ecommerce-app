"use client";

import CategoriesForm from "@/components/pages/admin/categories/CategoriesForm/CategoriesForm";
import FeatureHeader from "@/components/widgets/FeatureHeader/FeatureHeader";

export default function CreateCategoryPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-muted min-h-screen">
      <div className="grid grid-cols-[minmax(0,900px)] justify-center">
        <FeatureHeader
          title="Crear categoría"
          description="Registra una nueva categoría de productos"
          backUrl="/admin/categories"
        />
        <CategoriesForm />
      </div>
    </div>
  );
}
