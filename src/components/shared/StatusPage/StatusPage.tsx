import Link from "next/link";
import { AlertTriangle, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { StatusPageProps } from "./StatusPage.types";

export default function StatusPage({
  code,
  title,
  description,
  actions = [],
  className,
}: StatusPageProps) {
  const Icon = code === "404" ? FileQuestion : AlertTriangle;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-4 py-16 sm:py-24 text-center",
        className,
      )}
    >
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Icon className="h-8 w-8 text-muted-foreground" aria-hidden />
      </div>

      <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-2">
        {code === "404" ? "404" : "Error"}
      </p>

      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">{title}</h1>

      <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">{description}</p>

      {actions.length > 0 ? (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {actions.map((action) => {
            const variant = action.variant ?? "default";

            if (action.onClick) {
              return (
                <Button
                  key={action.label}
                  type="button"
                  variant={variant}
                  size="lg"
                  onClick={action.onClick}
                >
                  {action.label}
                </Button>
              );
            }

            if (action.href) {
              return (
                <Button key={action.label} asChild variant={variant} size="lg">
                  <Link href={action.href}>{action.label}</Link>
                </Button>
              );
            }

            return null;
          })}
        </div>
      ) : null}
    </div>
  );
}
