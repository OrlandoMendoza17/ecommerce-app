"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import FeatureHeader from "@/components/widgets/FeatureHeader/FeatureHeader";
import CategoriesTable from "@/components/Tables/CategoriesTable/CategoriesTable";

export default function AdminCategoriesPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-muted min-h-screen">
      <div className="grid grid-cols-[minmax(0,1300px)] justify-center">
        <FeatureHeader
          title="Categorías"
          description="Consulta y gestiona las categorías de productos de la tienda"
        >
          <Button asChild>
            <Link href="/admin/categories/create">Crear categoría</Link>
          </Button>
        </FeatureHeader>
        <CategoriesTable />
      </div>
    </div>
  );
}
