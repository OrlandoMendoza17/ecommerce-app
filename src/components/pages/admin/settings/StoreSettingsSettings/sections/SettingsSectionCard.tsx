import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import { twMerge } from "tailwind-merge";

interface SettingsSectionCardProps {
  id: string;
  title: string;
  description: string;
  className?: string;
  headerAction?: ReactNode;
  footer?: ReactNode;
  loading?: boolean;
  submitDisabled?: boolean;
  submitLabel?: string;
  onSubmit?: () => void;
  children: ReactNode;
}

export default function SettingsSectionCard({
  id,
  title,
  description,
  className,
  headerAction,
  footer,
  loading = false,
  submitDisabled = false,
  submitLabel = "Guardar cambios",
  onSubmit,
  children,
}: SettingsSectionCardProps) {
  const showFooter = Boolean(footer ?? onSubmit);

  return (
    <section id={id} className={twMerge("scroll-mt-24 space-y-3", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription className="mt-1">{description}</CardDescription>
        </div>
        {headerAction}
      </div>

      <Card>
        <CardContent>{children}</CardContent>

        {showFooter ? (
          <CardFooter className="justify-end border-t pt-6">
            {footer ?? (
              <Button
                type="button"
                onClick={onSubmit}
                disabled={loading || submitDisabled}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando...
                  </span>
                ) : (
                  submitLabel
                )}
              </Button>
            )}
          </CardFooter>
        ) : null}
      </Card>
    </section>
  );
}
