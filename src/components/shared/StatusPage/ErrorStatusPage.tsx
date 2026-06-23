"use client";

import StatusPage from "./StatusPage";
import type { StatusPageAction } from "./StatusPage.types";

type ErrorStatusPageProps = {
  code?: "error" | "500";
  title: string;
  description: string;
  actions: StatusPageAction[];
  reset: () => void;
  className?: string;
};

export default function ErrorStatusPage({
  code = "error",
  title,
  description,
  actions,
  reset,
  className,
}: ErrorStatusPageProps) {
  const resolvedActions = actions.map((action) =>
    action.label === "Reintentar" && !action.onClick
      ? { ...action, onClick: reset }
      : action,
  );

  return (
    <StatusPage
      code={code}
      title={title}
      description={description}
      actions={resolvedActions}
      className={className}
    />
  );
}
