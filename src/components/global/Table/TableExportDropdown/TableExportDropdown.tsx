"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  FileType,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { exportTableData, TableExportFormat } from "@/utils/export/tableExport";
import { TableExportDropdownProps } from "./TableExportDropdown.types";

export function TableExportDropdown<T = Record<string, unknown>>({
  title,
  filenamePrefix,
  columns,
  onFetchData,
  disabled,
  className,
}: TableExportDropdownProps<T>) {
  const [loading, setLoading] = useState(false);
  const { toast, errorToast } = useToast();

  const handleExport = async (format: TableExportFormat, scope: "current" | "all") => {
    try {
      setLoading(true);
      toast({
        title: "Preparando exportación...",
        description: `Generando archivo ${format.toUpperCase()} (${scope === "all" ? "Catálogo completo" : "Vista actual"
          }).`,
      });

      const data = await onFetchData(scope);

      if (!data || data.length === 0) {
        toast({
          title: "Sin datos",
          description: "No se encontraron registros para exportar con los filtros actuales.",
          variant: "error",
        });
        return;
      }

      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `${filenamePrefix}-${scope === "all" ? "completo" : "filtrado"}-${dateStr}`;

      await exportTableData({
        title,
        filename,
        columns,
        data,
        format,
      });

      toast({
        title: "Descarga completada",
        description: `Se exportaron ${data.length} registros en formato ${format.toUpperCase()}.`,
        variant: "success",
      });
    } catch (err: unknown) {
      errorToast(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || loading}
          className={`gap-1.5 text-xs h-9 bg-card hover:bg-muted/80 ${className ?? ""}`}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin text-primary" />
          ) : (
            <Download className="size-4 text-muted-foreground" />
          )}
          <span>Exportar</span>
          <ChevronDown className="size-3.5 opacity-60 ml-0.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Vista actual (Con filtros)
          </DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => handleExport("csv", "current")}
            className="gap-2 text-xs cursor-pointer"
          >
            <FileType className="size-4 text-sky-500" />
            <span>CSV (.csv)</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleExport("xlsx", "current")}
            className="gap-2 text-xs cursor-pointer"
          >
            <FileSpreadsheet className="size-4 text-emerald-500" />
            <span>Excel (.xlsx)</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleExport("pdf", "current")}
            className="gap-2 text-xs cursor-pointer"
          >
            <FileText className="size-4 text-rose-500" />
            <span>Documento PDF (.pdf)</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Todo el catálogo
          </DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => handleExport("csv", "all")}
            className="gap-2 text-xs cursor-pointer"
          >
            <FileType className="size-4 text-sky-500" />
            <span>CSV (.csv)</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleExport("xlsx", "all")}
            className="gap-2 text-xs cursor-pointer"
          >
            <FileSpreadsheet className="size-4 text-emerald-500" />
            <span>Excel (.xlsx)</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleExport("pdf", "all")}
            className="gap-2 text-xs cursor-pointer"
          >
            <FileText className="size-4 text-rose-500" />
            <span>Documento PDF (.pdf)</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
