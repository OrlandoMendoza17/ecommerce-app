import MyReviewsView from "@/components/pages/mis-opiniones/MyReviewsView/MyReviewsView";
import { Suspense } from "react";

export default function MisOpinionesPage() {
  return (
    <Suspense>
      <MyReviewsView />
    </Suspense>
  );
}
