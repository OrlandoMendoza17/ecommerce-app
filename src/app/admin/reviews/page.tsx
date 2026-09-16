"use client";

import FeatureHeader from "@/components/widgets/FeatureHeader/FeatureHeader";
import ReviewsTable from "@/components/Tables/ReviewsTable/ReviewsTable";

export default function AdminReviewsPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-muted min-h-screen">
      <div className="grid grid-cols-[minmax(0,1300px)] justify-center">
        <FeatureHeader
          title="Reseñas"
          description="Consulta, aprueba u oculta las opiniones de los clientes"
        />
        <ReviewsTable />
      </div>
    </div>
  );
}
