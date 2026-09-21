"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import BulkPriceAdjustModal from "./BulkPriceAdjustModal";
import BulkAssignModal from "./BulkAssignModal";
import {
  CheckCircle2,
  ChevronDown,
  DollarSign,
  FolderTree,
  Loader2,
  Sparkles,
  Trash2,
  X,
  XCircle,
} from "lucide-react";

interface Props {
  selectedCount: number;
  isAllPageSelected: boolean;
  allMatching: boolean;
  totalCount?: number;
  onToggleAllMatching: () => void;
  onClearSelection: () => void;
  onUpdateStatus: (isActive: boolean) => Promise<void>;
  onUpdateFeatured: (isFeatured: boolean) => Promise<void>;
  onAssign: (data: {
    category_id?: string | null;
    brand_id?: string | null;
  }) => Promise<void>;
  onAdjustPrice: (config: {
    mode: "percentage" | "fixed";
    amount: number;
    target: "price" | "compare_at_price" | "both";
    roundTo99: boolean;
  }) => Promise<void>;
  onDelete: () => Promise<void>;
}

export default function BulkActionsBar({
  selectedCount,
  isAllPageSelected,
  allMatching,
  totalCount,
  onToggleAllMatching,
  onClearSelection,
  onUpdateStatus,
  onUpdateFeatured,
  onAssign,
  onAdjustPrice,
  onDelete,
}: Props) {
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  if (selectedCount === 0) return null;

  const effectiveCount = allMatching && totalCount ? totalCount : selectedCount;

  const executeAction = async (fn: () => Promise<void>) => {
    try {
      setActionLoading(true);
      await fn();
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-[95vw] w-max animate-in fade-in slide-in-from-bottom-5 duration-200">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 bg-card/95 backdrop-blur-md border border-border/80 shadow-2xl rounded-2xl px-4 py-2.5 text-card-foreground">
          {/* Contador y opción de seleccionar todo el catálogo */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="px-2.5 py-1 text-xs font-semibold gap-1.5">
              <span>{effectiveCount}</span>
              <span className="font-normal text-muted-foreground">
                {effectiveCount === 1 ? "seleccionado" : "seleccionados"}
              </span>
            </Badge>

            {isAllPageSelected && totalCount && totalCount > selectedCount && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onToggleAllMatching}
                className="h-7 text-xs text-primary hover:text-primary font-medium underline underline-offset-2 px-2"
              >
                {allMatching
                  ? "Desmarcar catálogo completo"
                  : `¿Seleccionar los ${totalCount} productos del catálogo?`}
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              disabled={actionLoading}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              title="Deseleccionar todos"
            >
              <X className="size-3.5 mr-1" />
              Limpiar
            </Button>
          </div>

          <Separator orientation="vertical" className="hidden sm:block h-6" />

          {/* Grupo de acciones */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Estado */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={actionLoading}
                  className="h-8 text-xs gap-1 px-2.5 bg-background/50"
                >
                  <CheckCircle2 className="size-3.5 text-emerald-500" />
                  Estado
                  <ChevronDown className="size-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                <DropdownMenuItem
                  onClick={() => executeAction(() => onUpdateStatus(true))}
                  className="gap-2 cursor-pointer text-xs"
                >
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  Marcar como Activos
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => executeAction(() => onUpdateStatus(false))}
                  className="gap-2 cursor-pointer text-xs"
                >
                  <XCircle className="size-4 text-muted-foreground" />
                  Marcar como Inactivos
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Destacado */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={actionLoading}
                  className="h-8 text-xs gap-1 px-2.5 bg-background/50"
                >
                  <Sparkles className="size-3.5 text-amber-500" />
                  Destacado
                  <ChevronDown className="size-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                <DropdownMenuItem
                  onClick={() => executeAction(() => onUpdateFeatured(true))}
                  className="gap-2 cursor-pointer text-xs"
                >
                  <Sparkles className="size-4 text-amber-500" />
                  Marcar como Destacados
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => executeAction(() => onUpdateFeatured(false))}
                  className="gap-2 cursor-pointer text-xs"
                >
                  <X className="size-4 text-muted-foreground" />
                  Quitar de Destacados
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Asignar Categoría / Marca */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={actionLoading}
              onClick={() => setAssignModalOpen(true)}
              className="h-8 text-xs gap-1 px-2.5 bg-background/50"
            >
              <FolderTree className="size-3.5 text-blue-500" />
              Asignar
            </Button>

            {/* Ajustar Precios */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={actionLoading}
              onClick={() => setPriceModalOpen(true)}
              className="h-8 text-xs gap-1 px-2.5 bg-background/50"
            >
              <DollarSign className="size-3.5 text-emerald-500" />
              Precios
            </Button>

            {/* Eliminar Masivo */}
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={actionLoading}
              onClick={() => setDeleteModalOpen(true)}
              className="h-8 text-xs gap-1 px-2.5"
            >
              <Trash2 className="size-3.5" />
              Eliminar
            </Button>
          </div>
        </div>
      </div>

      {/* Modal Ajustar Precios */}
      <BulkPriceAdjustModal
        open={priceModalOpen}
        onOpenChange={setPriceModalOpen}
        count={effectiveCount}
        onConfirm={onAdjustPrice}
      />

      {/* Modal Asignar Categoría / Marca */}
      <BulkAssignModal
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
        count={effectiveCount}
        onAssign={onAssign}
      />

      {/* Modal Confirmar Eliminación Masiva */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="size-5" />
              Eliminación masiva de productos
            </DialogTitle>
            <DialogDescription className="pt-2">
              Estás a punto de eliminar permanentemente{" "}
              <strong>{effectiveCount}</strong>{" "}
              {effectiveCount === 1 ? "producto" : "productos"}.
              <br />
              <br />
              Esta acción eliminará todas las variantes, precios, imágenes asociadas e historial de inventario.{" "}
              <span className="font-semibold text-destructive">
                Esta acción no se puede deshacer.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={actionLoading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={actionLoading}
              onClick={async () => {
                try {
                  setActionLoading(true);
                  await onDelete();
                  setDeleteModalOpen(false);
                } finally {
                  setActionLoading(false);
                }
              }}
            >
              {actionLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Sí, eliminar permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
