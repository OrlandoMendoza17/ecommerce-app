import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { twMerge } from "tailwind-merge";

interface SettingsSectionCardProps {
  id: string;
  title: string;
  description: string;
  className?: string;
  loading?: boolean;
  submitDisabled?: boolean;
  submitLabel?: string;
  onSubmit: () => void;
  children: ReactNode;
}

export default function SettingsSectionCard({
  id,
  title,
  description,
  className,
  loading = false,
  submitDisabled = false,
  submitLabel = "Guardar cambios",
  onSubmit,
  children,
}: SettingsSectionCardProps) {
  return (
    <Card id={id} className={twMerge("scroll-mt-24", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="mt-1.5">{description}</CardDescription>
      </CardHeader>

      <CardContent>{children}</CardContent>

      <CardFooter className="justify-end border-t pt-6">
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
      </CardFooter>
    </Card>
  );
}
