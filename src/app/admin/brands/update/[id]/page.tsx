"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import BrandsForm from "@/components/pages/admin/brands/BrandsForm/BrandsForm";
import FeatureHeader from "@/components/widgets/FeatureHeader/FeatureHeader";
import { trpc } from "@/config/trpc.config";
import AdminPageSkeleton from "@/components/widgets/AdminPageSkeleton/AdminPageSkeleton";

export default function UpdateBrandPage() {
  const router = useRouter();
  const params = useParams();
  const brandId = params.id as string;

  const { data: brand, isLoading } = trpc.brands.getById.useQuery(
    { id: brandId },
    { enabled: !!brandId }
  );

  useEffect(() => {
    if (!isLoading && !brand) {
      router.push("/admin/brands");
    }
  }, [isLoading, brand, router]);

  if (isLoading || !brand) {
    return <AdminPageSkeleton />;
  }

  return (
    <div className="flex-1 overflow-y-auto bg-muted min-h-screen">
      <div className="grid grid-cols-[minmax(0,900px)] justify-center">
        <FeatureHeader
          title="Actualizar marca"
          description="Modifica la información de la marca"
          backUrl="/admin/brands"
        />
        <BrandsForm brand={brand} />
      </div>
    </div>
  );
}
