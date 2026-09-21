"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileType,
  Loader2,
  RefreshCw,
  UploadCloud,
} from "lucide-react";
import {
  downloadImportTemplate,
  parseSpreadsheetFile,
} from "@/utils/import/tableImport";
import { TableImportModalProps } from "./TableImportModal.types";
import { useToast } from "@/hooks/useToast";

export function TableImportModal<T>({
  open,
  onOpenChange,
  title,
  description,
  filenamePrefix,
  templateColumns,
  parseAndValidate,
  onImport,
  onSuccess,
}: TableImportModalProps<T>) {
  const { toast, errorToast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState<string | null>(null);

  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [validItems, setValidItems] = useState<T[]>([]);
  const [validationErrors, setValidationErrors] = useState<
    { row: number; reason: string }[]
  >([]);

  const resetState = () => {
    setFile(null);
    setRawRows([]);
    setValidItems([]);
    setValidationErrors([]);
    setParsing(false);
    setImporting(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetState();
    }
    onOpenChange(newOpen);
  };

  const handleFile = async (selectedFile: File) => {
    try {
      setParsing(true);
      setFile(selectedFile);

      const parsed = await parseSpreadsheetFile(selectedFile);
      setRawRows(parsed.rows);

      const { validItems, errors } = parseAndValidate(parsed.rows);
      setValidItems(validItems);
      setValidationErrors(errors);
    } catch (err: unknown) {
      errorToast(err as Error);
      resetState();
    } finally {
      setParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDownloadTemplate = async (format: "csv" | "xlsx") => {
    try {
      setDownloadingTemplate(format);
      await downloadImportTemplate(filenamePrefix, templateColumns, format);
      toast({
        title: "Plantilla descargada",
        description: `Plantilla en formato ${format.toUpperCase()} guardada con éxito.`,
      });
    } catch (err: unknown) {
      errorToast(err as Error);
    } finally {
      setDownloadingTemplate(null);
    }
  };

  const handleConfirmImport = async () => {
    if (validItems.length === 0) return;
    try {
      setImporting(true);
      const result = await onImport(validItems);

      const createdCount = result.created ?? 0;
      const updatedCount = result.updated ?? 0;
      const backendErrors = result.errors ?? [];

      if (backendErrors.length > 0) {
        toast({
          title: "Importación completada con advertencias",
          description: `Se procesaron ${createdCount + updatedCount} registros. ${
            backendErrors.length
          } filas presentaron errores.`,
          variant: "error",
        });
      } else {
        toast({
          title: "Importación exitosa",
          description: `Se crearon ${createdCount} y actualizaron ${updatedCount} registros correctamente.`,
          variant: "success",
        });
      }

      onSuccess?.();
      handleOpenChange(false);
    } catch (err: unknown) {
      errorToast(err as Error);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-4 sm:p-6 overflow-hidden">
        <DialogHeader className="shrink-0 space-y-1">
          <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <UploadCloud className="size-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {description ||
              "Sube un archivo en formato Excel (.xlsx) o CSV (.csv) para importar o actualizar registros en lote."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
          {/* Descarga de plantillas */}
          <div className="rounded-lg border border-border/80 bg-muted/40 p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">
                  ¿No tienes el formato exacto?
                </p>
                <p className="text-[11px] sm:text-xs text-muted-foreground">
                  Descarga una plantilla de ejemplo prediseñada con las columnas requeridas.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!!downloadingTemplate}
                  onClick={() => handleDownloadTemplate("xlsx")}
                  className="gap-1.5 text-xs h-8 bg-card"
                >
                  {downloadingTemplate === "xlsx" ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="size-3.5 text-emerald-500" />
                  )}
                  Excel (.xlsx)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!!downloadingTemplate}
                  onClick={() => handleDownloadTemplate("csv")}
                  className="gap-1.5 text-xs h-8 bg-card"
                >
                  {downloadingTemplate === "csv" ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <FileType className="size-3.5 text-sky-500" />
                  )}
                  CSV (.csv)
                </Button>
              </div>
            </div>
          </div>

          {/* Zona Dropzone */}
          {!file && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-border/80 rounded-xl p-6 sm:p-8 text-center hover:border-primary/50 transition-colors bg-card flex flex-col items-center justify-center cursor-pointer group"
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel";
                input.onchange = (e) => {
                  const files = (e.target as HTMLInputElement).files;
                  if (files && files[0]) handleFile(files[0]);
                };
                input.click();
              }}
            >
              <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3 group-hover:scale-105 transition-transform">
                <UploadCloud className="size-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                Haz clic o arrastra tu archivo aquí
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Formatos compatibles: Excel (.xlsx, .xls) o CSV (.csv)
              </p>
            </div>
          )}

          {/* Estado de carga */}
          {parsing && (
            <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground text-sm">
              <Loader2 className="size-4 animate-spin text-primary" />
              <span>Analizando y validando estructura del archivo...</span>
            </div>
          )}

          {/* Previsualización del archivo */}
          {file && !parsing && (
            <div className="space-y-3">
              {/* Resumen del archivo */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="size-5 text-emerald-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate max-w-[200px] sm:max-w-xs">
                      {file.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB • {rawRows.length} filas detectadas
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs gap-1">
                    <CheckCircle2 className="size-3 text-emerald-500" />
                    <span>{validItems.length} válidas</span>
                  </Badge>
                  {validationErrors.length > 0 && (
                    <Badge variant="destructive" className="text-xs gap-1">
                      <AlertCircle className="size-3" />
                      <span>{validationErrors.length} con error</span>
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetState}
                    className="h-7 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <RefreshCw className="size-3 mr-1" />
                    Cambiar
                  </Button>
                </div>
              </div>

              {/* Errores de validación si existen */}
              {validationErrors.length > 0 && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs space-y-1 max-h-32 overflow-y-auto">
                  <p className="font-semibold text-destructive flex items-center gap-1.5">
                    <AlertCircle className="size-3.5" />
                    Filas que no se importarán debido a errores:
                  </p>
                  <ul className="list-disc list-inside text-destructive/90 space-y-0.5 pl-1">
                    {validationErrors.slice(0, 10).map((err, idx) => (
                      <li key={idx}>
                        Fila #{err.row}: {err.reason}
                      </li>
                    ))}
                    {validationErrors.length > 10 && (
                      <li className="font-semibold">
                        ... y {validationErrors.length - 10} filas más con errores.
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Tabla de previsualización responsiva con scroll horizontal */}
              {rawRows.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Previsualización de filas leídas (primeras 5):
                  </p>
                  <div className="border rounded-md overflow-x-auto max-h-48">
                    <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                      <thead className="bg-muted/70 text-muted-foreground border-b sticky top-0">
                        <tr>
                          <th className="p-2 font-medium">#</th>
                          {templateColumns.map((col) => (
                            <th key={col.key} className="p-2 font-medium whitespace-nowrap">
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {rawRows.slice(0, 5).map((row, idx) => {
                          const hasErr = validationErrors.some((e) => e.row === idx + 2);
                          return (
                            <tr
                              key={idx}
                              className={hasErr ? "bg-destructive/5 text-destructive" : ""}
                            >
                              <td className="p-2 font-mono text-[10px] text-muted-foreground">
                                {idx + 1}
                              </td>
                              {templateColumns.map((col) => (
                                <td
                                  key={col.key}
                                  className="p-2 whitespace-nowrap truncate max-w-[150px]"
                                >
                                  {row[col.label] ?? row[col.key] ?? "-"}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 pt-3 border-t flex-row items-center justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={importing}
            className="text-xs h-9"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmImport}
            disabled={validItems.length === 0 || importing}
            className="text-xs h-9 gap-2"
          >
            {importing && <Loader2 className="size-3.5 animate-spin" />}
            Confirmar e Importar {validItems.length > 0 ? `(${validItems.length})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
