"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, Loader2, Sparkles, Trash2, X } from "lucide-react";
import { TableBulkBarProps, TableBulkDeleteActionProps } from "./TableBulkBar.types";

export function TableBulkDeleteAction({
  onDelete,
  title = "¿Eliminar elementos seleccionados?",
  description,
  count,
  disabled,
}: TableBulkDeleteActionProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onDelete();
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        disabled={disabled || loading}
        onClick={() => setOpen(true)}
        className="gap-1.5 text-xs h-8"
      >
        <Trash2 className="size-3.5" />
        <span className="hidden xs:inline">Eliminar</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="size-5" />
              {title}
            </DialogTitle>
            <DialogDescription className="pt-2">
              {description ||
                `Esta acción es irreversible. Se eliminarán permanentemente ${
                  count !== undefined ? count : "los"
                } registros seleccionados de la base de datos.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={loading}
              className="gap-2"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              Confirmar eliminación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function TableBulkBar({
  selectedCount,
  effectiveCount,
  isAllPageSelected,
  allMatching,
  totalCount,
  itemLabel = "elementos",
  onToggleAllMatching,
  onClearSelection,
  children,
}: TableBulkBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100vw-1.5rem)] sm:w-auto max-w-xl duration-200 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 bg-card/95 backdrop-blur-md border border-border/80 shadow-2xl rounded-2xl p-2.5 sm:px-4 sm:py-2.5 text-card-foreground">
        {/* Contador y opción de seleccionar todo el catálogo */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="px-2.5 py-1 text-xs font-semibold gap-1.5"
            >
              <span>{effectiveCount}</span>
              <span className="font-normal text-muted-foreground">
                {effectiveCount === 1 ? "seleccionado" : "seleccionados"}
              </span>
            </Badge>

            {isAllPageSelected &&
              totalCount &&
              totalCount > selectedCount &&
              onToggleAllMatching && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleAllMatching}
                  className="h-7 text-xs font-medium text-primary hover:text-primary hover:bg-primary/10 gap-1 px-2"
                >
                  {allMatching ? (
                    <>
                      <CheckCircle2 className="size-3.5 text-emerald-500" />
                      <span className="truncate max-w-[130px] sm:max-w-none">
                        Todo el catálogo seleccionado
                      </span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-3.5" />
                      <span className="truncate max-w-[130px] sm:max-w-none">
                        Seleccionar los {totalCount} {itemLabel}
                      </span>
                    </>
                  )}
                </Button>
              )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClearSelection}
            title="Deseleccionar todos"
            className="size-7 text-muted-foreground hover:text-foreground rounded-full"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Separador solo en desktop/tablet */}
        {children && (
          <Separator
            orientation="vertical"
            className="hidden sm:block h-6 bg-border/80"
          />
        )}

        {/* Acciones masivas */}
        {children && (
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center sm:justify-start w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-border/50">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

TableBulkBar.Delete = TableBulkDeleteAction;
