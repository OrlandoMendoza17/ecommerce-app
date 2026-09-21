"use client";

import { Suspense } from "react";
import FeatureHeader from "@/components/widgets/FeatureHeader/FeatureHeader";
import ProductsTable from "@/components/Tables/ProductsTable/ProductsTable";
import ProductsHeaderActions from "@/components/pages/admin/products/ProductsHeaderActions/ProductsHeaderActions";

export default function AdminProductsPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-muted min-h-screen">
      <div className="grid grid-cols-[minmax(0,1300px)] justify-center">
        <FeatureHeader
          title="Productos"
          description="Consulta y gestiona el catálogo de productos de la tienda"
        >
          <Suspense fallback={null}>
            <ProductsHeaderActions />
          </Suspense>
        </FeatureHeader>
        <ProductsTable />
      </div>
    </div>
  );
}
