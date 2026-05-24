"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import FeatureHeader from "@/components/widgets/FeatureHeader/FeatureHeader";
import ProductsTable from "@/components/Tables/ProductsTable/ProductsTable";

export default function AdminProductsPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-muted min-h-screen">
      <div className="grid grid-cols-[minmax(0,1300px)] justify-center">
        <FeatureHeader
          title="Productos"
          description="Consulta y gestiona el catálogo de productos de la tienda"
        >
          <Button asChild>
            <Link href="/admin/products/create">Crear producto</Link>
          </Button>
        </FeatureHeader>
        <ProductsTable />
      </div>
    </div>
  );
}
