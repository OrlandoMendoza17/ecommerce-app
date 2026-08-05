import { Suspense } from "react";
import ProductCatalog from "@/components/pages/productos/ProductCatalog/ProductCatalog";

export default function ProductosPage() {
  return (
    <div className="bg-gray-50">
      {/* <header className="bg-primary">
        <div className="mx-auto w-full px-4 py-6 sm:px-2.5 min-[1180px]:max-w-300 min-[1340px]:max-w-325">
          <h1 className="text-2xl font-bold text-primary-foreground sm:text-3xl">
            Productos
          </h1>
        </div>
      </header> */}

      <div className="mx-auto w-full min-h-170 py-4 sm:px-2.5 sm:py-6 lg:py-8 min-[1180px]:max-w-300 min-[1340px]:max-w-325">
        <Suspense
          fallback={
            <div className="flex min-h-[40vh] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          }
        >
          <ProductCatalog />
        </Suspense>
      </div>
    </div>
  );
}
