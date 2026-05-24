"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ProductsForm from "@/components/pages/admin/products/ProductsForm/ProductsForm";
import FeatureHeader from "@/components/widgets/FeatureHeader/FeatureHeader";
import { trpc } from "@/config/trpc.config";
import AdminPageSkeleton from "@/components/widgets/AdminPageSkeleton/AdminPageSkeleton";

export default function UpdateProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const { data: product, isLoading } = trpc.products.getById.useQuery(
    { id: productId },
    { enabled: !!productId },
  );

  useEffect(() => {
    if (!isLoading && !product) {
      router.push("/admin/products");
    }
  }, [isLoading, product, router]);

  if (isLoading || !product) {
    return <AdminPageSkeleton />;
  }

  return (
    <div className="flex-1 overflow-y-auto bg-muted min-h-screen">
      <div className="grid grid-cols-[minmax(0,900px)] justify-center">
        <FeatureHeader
          title="Actualizar producto"
          description="Modifica la información del producto"
          backUrl="/admin/products"
        />
        <ProductsForm product={product} />
      </div>
    </div>
  );
}
