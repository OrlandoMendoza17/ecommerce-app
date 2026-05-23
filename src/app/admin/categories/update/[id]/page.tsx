"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import CategoriesForm from "@/components/pages/admin/categories/CategoriesForm/CategoriesForm";
import FeatureHeader from "@/components/widgets/FeatureHeader/FeatureHeader";
import { trpc } from "@/config/trpc.config";
import AdminPageSkeleton from "@/components/widgets/AdminPageSkeleton/AdminPageSkeleton";

export default function UpdateCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;

  const { data: category, isLoading } = trpc.categories.getById.useQuery(
    { id: categoryId },
    { enabled: !!categoryId },
  );

  useEffect(() => {
    if (!isLoading && !category) {
      router.push("/admin/categories");
    }
  }, [isLoading, category, router]);

  if (isLoading || !category) {
    return <AdminPageSkeleton />;
  }

  return (
    <div className="flex-1 overflow-y-auto bg-muted min-h-screen">
      <div className="grid grid-cols-[minmax(0,900px)] justify-center">
        <FeatureHeader
          title="Actualizar categoría"
          description="Modifica la información de la categoría"
          backUrl="/admin/categories"
        />
        <CategoriesForm category={category} />
      </div>
    </div>
  );
}
