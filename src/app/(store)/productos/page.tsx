import { Package } from "lucide-react";
import ProductCatalog from "@/components/pages/productos/ProductCatalog/ProductCatalog";

export default function ProductosPage() {
  return (
    <div className="bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center space-x-3 mb-2">
            <Package className="h-8 w-8 text-primary" />
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Nuestros Productos
            </h1>
          </div>
          <p className="text-gray-600">
            Explora nuestro catálogo completo de productos
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <ProductCatalog />
      </div>
    </div>
  );
}
