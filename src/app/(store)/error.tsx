"use client";

import ErrorStatusPage from "@/components/shared/StatusPage/ErrorStatusPage";
import { storeErrorPreset } from "@/components/shared/StatusPage/status-page.presets";

type StoreErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function StoreError({ reset }: StoreErrorProps) {
  return (
    <ErrorStatusPage
      {...storeErrorPreset}
      reset={reset}
      className="min-h-[60vh]"
    />
  );
}
