"use client";

import ErrorStatusPage from "@/components/shared/StatusPage/ErrorStatusPage";
import { rootErrorPreset } from "@/components/shared/StatusPage/status-page.presets";

type RootErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RootError({ reset }: RootErrorProps) {
  return (
    <ErrorStatusPage
      {...rootErrorPreset}
      reset={reset}
      className="min-h-screen"
    />
  );
}
