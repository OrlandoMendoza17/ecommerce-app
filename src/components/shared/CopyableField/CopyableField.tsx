"use client";

import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";

interface CopyableFieldProps {
  label: string;
  value: string;
  className?: string;
}

export default function CopyableField({ label, value, className }: CopyableFieldProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast({ title: "Copiado al portapapeles", variant: "success" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "No se pudo copiar",
        description: "Intenta seleccionar el texto manualmente.",
        variant: "error",
      });
    }
  };

  return (
    <div className={cn("flex items-start justify-between gap-3 py-2", className)}>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900 break-all">{value}</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0 text-gray-500 hover:text-gray-900"
        onClick={handleCopy}
        aria-label={`Copiar ${label}`}
        disabled={!value}
      >
        {copied ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
      </Button>
    </div>
  );
}
