import Link from "next/link";
import { ChevronRight } from "lucide-react";
import ProductGallery from "@/components/pages/productos/ProductGallery/ProductGallery";
import ProductInfo from "@/components/pages/productos/ProductInfo/ProductInfo";
import ProductOptions from "@/components/pages/productos/ProductOptions/ProductOptions";
import ProductDescription from "@/components/pages/productos/ProductDescription/ProductDescription";
import RelatedProducts from "@/components/pages/productos/RelatedProducts/RelatedProducts";
import { productDetailMock } from "@/mocks/product-detail";
import { ProductOption } from "@/components/pages/productos/ProductOptions/ProductOptions.types";

const mockDimensions: ProductOption[] = [
  { id: "1", label: "S", value: "s", available: true },
  { id: "2", label: "M", value: "m", available: true },
  { id: "3", label: "L", value: "l", available: true },
  { id: "4", label: "XL", value: "xl", available: false },
];

const mockThicknesses: ProductOption[] = [
  { id: "1", label: "Negro", value: "negro", available: true },
  { id: "2", label: "Blanco", value: "blanco", available: true },
  { id: "3", label: "Azul", value: "azul", available: false },
];

const mockDescription = `
  Auriculares inalámbricos con sonido envolvente y micrófono integrado para llamadas
  y videoconferencias. Conectividad Bluetooth 5.3, estuche de carga incluido y controles
  táctiles en cada auricular.

  Ideales para trabajo, viajes o uso diario. La cancelación activa de ruido te permite
  concentrarte donde quieras. Incluyen cable USB-C y varias almohadillas para un ajuste
  cómodo.
`;

const mockSpecifications = {
  "Marca": "Genérica / OEM",
  "Conectividad": "Bluetooth 5.3",
  "Autonomía": "Hasta 30 horas (con estuche)",
  "Cancelación de ruido": "Activa (ANC)",
  "Peso": "250 g (con estuche)",
  "Garantía": "12 meses",
  "Contenido": "Auriculares, estuche, cable USB-C, manual",
};

export default function ProductDetailPage() {
  return (
    <div className="bg-white">
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <Link href="/" className="text-gray-600 hover:text-primary">
              Inicio
            </Link>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <Link href="/productos" className="text-gray-600 hover:text-primary">
              Productos
            </Link>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <span className="text-gray-900 font-medium">
              {productDetailMock.name}
            </span>
          </nav>
        </div>
      </div>

      {/* Product Detail */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12">
          <ProductGallery
            images={productDetailMock.images}
            productName={productDetailMock.name}
          />

          <div className="mt-8 lg:mt-0 space-y-8">
            <ProductInfo product={productDetailMock} />

            <div className="border-t border-gray-200 pt-8">
              <ProductOptions
                dimensions={mockDimensions}
                thicknesses={mockThicknesses}
              />
            </div>
          </div>
        </div>
      </div>

      <ProductDescription
        description={mockDescription}
        specifications={mockSpecifications}
      />

      <RelatedProducts />
    </div>
  );
}
