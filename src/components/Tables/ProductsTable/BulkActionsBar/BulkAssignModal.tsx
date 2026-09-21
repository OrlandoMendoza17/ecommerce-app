"use client";

import { useState } from "react";
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
import { trpc } from "@/config/trpc.config";
import { FolderTree, Loader2, Tag } from "lucide-react";

const NO_CHANGE = "__NO_CHANGE__";
const REMOVE_ASSIGNMENT = "__REMOVE__";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  onAssign: (data: {
    category_id?: string | null;
    brand_id?: string | null;
  }) => Promise<void>;
}

export default function BulkAssignModal({
  open,
  onOpenChange,
  count,
  onAssign,
}: Props) {
  const [targetType, setTargetType] = useState<"category" | "brand">("category");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(NO_CHANGE);
  const [selectedBrandId, setSelectedBrandId] = useState<string>(NO_CHANGE);
  const [loading, setLoading] = useState(false);

  const { data: categories = [], isLoading: loadingCategories } =
    trpc.categories.select.useQuery({ is_active: undefined });

  const { data: brands = [], isLoading: loadingBrands } =
    trpc.brands.select.useQuery({ is_active: undefined });

  const handleApply = async () => {
    try {
      setLoading(true);

      const payload: { category_id?: string | null; brand_id?: string | null } = {};

      if (targetType === "category" && selectedCategoryId !== NO_CHANGE) {
        payload.category_id =
          selectedCategoryId === REMOVE_ASSIGNMENT ? null : selectedCategoryId;
      }

      if (targetType === "brand" && selectedBrandId !== NO_CHANGE) {
        payload.brand_id =
          selectedBrandId === REMOVE_ASSIGNMENT ? null : selectedBrandId;
      }

      await onAssign(payload);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const isCategoryApplyDisabled =
    targetType === "category" && selectedCategoryId === NO_CHANGE;
  const isBrandApplyDisabled =
    targetType === "brand" && selectedBrandId === NO_CHANGE;
  const isButtonDisabled =
    loading || isCategoryApplyDisabled || isBrandApplyDisabled;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Asignación masiva de catálogo</DialogTitle>
          <DialogDescription>
            Reasigna la categoría o marca a los <strong>{count}</strong>{" "}
            {count === 1 ? "producto seleccionado" : "productos seleccionados"}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Selector de pestaña / modo */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={targetType === "category" ? "default" : "outline"}
              className="gap-2"
              onClick={() => setTargetType("category")}
            >
              <FolderTree className="size-4" />
              Categoría
            </Button>
            <Button
              type="button"
              variant={targetType === "brand" ? "default" : "outline"}
              className="gap-2"
              onClick={() => setTargetType("brand")}
            >
              <Tag className="size-4" />
              Marca
            </Button>
          </div>

          {targetType === "category" ? (
            <div className="space-y-2">
              <Label className="text-xs">Selecciona la nueva categoría</Label>
              <Select
                value={selectedCategoryId}
                onValueChange={setSelectedCategoryId}
                disabled={loadingCategories}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CHANGE}>-- Seleccionar opción --</SelectItem>
                  <SelectItem value={REMOVE_ASSIGNMENT}>
                    (Dejar sin categoría asignada)
                  </SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-xs">Selecciona la nueva marca</Label>
              <Select
                value={selectedBrandId}
                onValueChange={setSelectedBrandId}
                disabled={loadingBrands}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una marca..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CHANGE}>-- Seleccionar opción --</SelectItem>
                  <SelectItem value={REMOVE_ASSIGNMENT}>
                    (Dejar sin marca asignada)
                  </SelectItem>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={handleApply} disabled={isButtonDisabled}>
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Guardar asignación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
