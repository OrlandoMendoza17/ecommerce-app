"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  downloadSampleTemplateCsv,
  parseAndValidateProductsCsv,
  ParsedCsvResult,
} from "@/utils/csv/productCsv";
import { trpc } from "@/config/trpc.config";
import { useToast } from "@/hooks/useToast";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  RotateCcw,
  UploadCloud,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters/currency";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProductImportModal({ open, onOpenChange }: Props) {
  const { toast, errorToast } = useToast();
  const utils = trpc.useUtils();

  const [file, setFile] = useState<File | null>(null);
  const [parsedResult, setParsedResult] = useState<ParsedCsvResult | null>(null);
  const [mode, setMode] = useState<"upsert" | "stock_price_only" | "create_only">(
    "upsert"
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const bulkImportMutation = trpc.products.bulkImport.useMutation({
    onError: (err) => errorToast(err),
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const result = parseAndValidateProductsCsv(text);
        setParsedResult(result);
      }
    };
    reader.readAsText(selectedFile);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".csv"],
    },
    maxFiles: 1,
  });

  const resetState = () => {
    setFile(null);
    setParsedResult(null);
    setIsProcessing(false);
  };

  const handleImport = async () => {
    if (!parsedResult || parsedResult.validItems.length === 0) return;

    try {
      setIsProcessing(true);
      const res = await bulkImportMutation.mutateAsync({
        items: parsedResult.validItems,
        mode,
      });

      toast({
        title: "Importación completada",
        description: `Se crearon ${res.created} productos y se actualizaron ${res.updated}.`,
        variant: "success",
      });

      if (res.errors && res.errors.length > 0) {
        toast({
          title: "Advertencia en importación",
          description: `${res.errors.length} filas presentaron errores no fatales.`,
          variant: "error",
        });
      }

      utils.products.invalidate();
      onOpenChange(false);
      resetState();
    } catch (err: unknown) {
      errorToast(err as Error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!isProcessing) {
          onOpenChange(next);
          if (!next) resetState();
        }
      }}
    >
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="size-5 text-emerald-500" />
            Importar catálogo desde CSV
          </DialogTitle>
          <DialogDescription>
            Carga o actualiza productos masivamente. Puedes descargar la plantilla
            oficial para asegurar el formato correcto.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Botón para descargar plantilla oficial */}
          <div className="flex items-center justify-between rounded-lg border border-dashed p-3 bg-muted/30">
            <div className="space-y-0.5">
              <p className="text-xs font-medium">¿Primera vez importando?</p>
              <p className="text-[11px] text-muted-foreground">
                Descarga nuestra plantilla con las columnas recomendadas y ejemplos.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadSampleTemplateCsv}
              className="gap-1.5 text-xs h-8"
            >
              <Download className="size-3.5" />
              Descargar plantilla
            </Button>
          </div>

          {!file ? (
            /* Zona Dropzone */
            <div
              {...getRootProps()}
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer transition-colors ${
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 bg-card hover:bg-muted/20"
              }`}
            >
              <input {...getInputProps()} />
              <div className="p-3 bg-primary/10 rounded-full mb-3 text-primary">
                <UploadCloud className="size-6" />
              </div>
              <p className="text-sm font-medium text-center">
                Arrastra tu archivo CSV aquí o haz clic para seleccionarlo
              </p>
              <p className="text-xs text-muted-foreground mt-1 text-center">
                Soporta archivos .csv con codificación UTF-8
              </p>
            </div>
          ) : (
            /* Vista previa del archivo cargado */
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-3 bg-card">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-md">
                    <FileSpreadsheet className="size-5" />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetState}
                  disabled={isProcessing}
                  className="text-xs text-muted-foreground hover:text-foreground gap-1"
                >
                  <RotateCcw className="size-3.5" />
                  Cambiar archivo
                </Button>
              </div>

              {parsedResult && (
                <>
                  {/* Resumen de validación */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg border p-2.5 bg-muted/30 text-center">
                      <p className="text-[11px] text-muted-foreground">Total filas</p>
                      <p className="text-lg font-bold">{parsedResult.totalRows}</p>
                    </div>
                    <div className="rounded-lg border border-emerald-500/30 p-2.5 bg-emerald-500/5 text-center">
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        Válidas
                      </p>
                      <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        {parsedResult.validItems.length}
                      </p>
                    </div>
                    <div className="rounded-lg border border-amber-500/30 p-2.5 bg-amber-500/5 text-center">
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                        Con errores
                      </p>
                      <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                        {parsedResult.invalidRows.length}
                      </p>
                    </div>
                  </div>

                  {/* Selector de modo de importación */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      Modo de procesamiento:
                    </Label>
                    <Select
                      value={mode}
                      onValueChange={(val: "upsert" | "stock_price_only" | "create_only") =>
                        setMode(val)
                      }
                      disabled={isProcessing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upsert">
                          Crear nuevos y actualizar existentes (por SKU / Slug)
                        </SelectItem>
                        <SelectItem value="stock_price_only">
                          Solo actualizar Stock y Precios de existentes
                        </SelectItem>
                        <SelectItem value="create_only">
                          Solo crear nuevos (omitir existentes)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Previsualización de los primeros válidos */}
                  {parsedResult.validItems.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">
                        Vista previa de productos a procesar (primeros 3):
                      </p>
                      <div className="rounded-lg border divide-y text-xs">
                        {parsedResult.validItems.slice(0, 3).map((item, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 flex items-center justify-between gap-2"
                          >
                            <div className="truncate">
                              <p className="font-medium truncate">{item.name}</p>
                              <p className="text-muted-foreground text-[11px]">
                                SKU: {item.sku || "Sin SKU"} · Stock:{" "}
                                {item.stock_quantity ?? 0}
                              </p>
                            </div>
                            <span className="font-semibold tabular-nums">
                              {formatCurrency(item.price)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Filas con errores */}
                  {parsedResult.invalidRows.length > 0 && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
                      <div className="flex items-center gap-1.5 text-destructive font-medium text-xs">
                        <AlertCircle className="size-4" />
                        <span>
                          {parsedResult.invalidRows.length} filas contienen errores y
                          serán ignoradas:
                        </span>
                      </div>
                      <div className="max-h-28 overflow-y-auto space-y-1 text-[11px] text-destructive/90">
                        {parsedResult.invalidRows.slice(0, 5).map((inv, i) => (
                          <p key={i}>
                            Fila {inv.row}: {inv.errors.join(", ")}
                          </p>
                        ))}
                        {parsedResult.invalidRows.length > 5 && (
                          <p className="text-muted-foreground text-[10px]">
                            ...y {parsedResult.invalidRows.length - 5} filas más con
                            errores.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={
              isProcessing ||
              !parsedResult ||
              parsedResult.validItems.length === 0
            }
            onClick={handleImport}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Procesando catálogo...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 size-4" />
                Importar {parsedResult?.validItems.length ?? 0} productos
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
