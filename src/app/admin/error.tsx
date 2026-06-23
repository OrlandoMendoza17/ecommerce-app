"use client";

import ErrorStatusPage from "@/components/shared/StatusPage/ErrorStatusPage";
import { adminErrorPreset } from "@/components/shared/StatusPage/status-page.presets";

type AdminErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AdminError({ reset }: AdminErrorProps) {
  return (
    <ErrorStatusPage
      {...adminErrorPreset}
      reset={reset}
      className="min-h-[50vh]"
    />
  );
}
