"use client";

import { useState, useImperativeHandle, forwardRef, useEffect } from "react";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/config/trpc.config";
import { useToast } from "@/hooks/useToast";

export interface ProductVariantsSectionHandle {
  saveVariants: (productId: string) => Promise<void>;
  getDraftVariants: () => DraftVariant[];
}

export interface DraftVariant {
  id?: string;
  sku: string;
  price: number;
  compare_at_price: number;
  cost: number;
  stock_quantity: number;
  low_stock_threshold: number;
  allow_backorder: boolean;
  is_active: boolean;
  option_value_ids: string[];
  _label?: string;
}

interface OptionType {
  id: string;
  name: string;
  values: { id: string; value: string }[];
}

interface Props {
  productId?: string;
}

const isValidUuid = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

const emptyVariant = (): DraftVariant => ({
  sku: "",
  price: 0,
  compare_at_price: 0,
  cost: 0,
  stock_quantity: 0,
  low_stock_threshold: 0,
  allow_backorder: false,
  is_active: true,
  option_value_ids: [],
});

const ProductVariantsSection = forwardRef<ProductVariantsSectionHandle, Props>(
  ({ productId }, ref) => {
    const { toast, errorToast } = useToast();

    // ── Option types state ────────────────────────────────────────────
    const [optionTypes, setOptionTypes] = useState<OptionType[]>([]);
    const [newTypeName, setNewTypeName] = useState("");
    const [newValueInputs, setNewValueInputs] = useState<Record<string, string>>({});

    // ── Variants state ────────────────────────────────────────────────
    const [variants, setVariants] = useState<DraftVariant[]>([emptyVariant()]);
    const [editingIdx, setEditingIdx] = useState<number | null>(0);
    const [expandedIdx, setExpandedIdx] = useState<number | null>(0);

    // ── Server data for edit mode ─────────────────────────────────────
    const isEditMode = !!productId;

    const { data: serverVariants } = trpc.productVariants.selectByProduct.useQuery(
      { product_id: productId! },
      { enabled: isEditMode }
    );

    useEffect(() => {
      if (serverVariants && serverVariants.length > 0) {
        setVariants(
          serverVariants.map((v) => ({
            id: v.id,
            sku: v.sku,
            price: v.price,
            compare_at_price: v.compare_at_price,
            cost: v.cost,
            stock_quantity: v.stock_quantity,
            low_stock_threshold: v.low_stock_threshold,
            allow_backorder: v.allow_backorder,
            is_active: v.is_active,
            option_value_ids: v.options.map((o) => o.option_value_id),
            _label: v.options.map((o) => `${o.type_name}: ${o.value}`).join(" / "),
          }))
        );
      }
    }, [serverVariants]);

    const { data: serverOptionTypes } = trpc.productOptionTypes.selectByProduct.useQuery(
      { product_id: productId! },
      { enabled: isEditMode }
    );

    useEffect(() => {
      if (serverOptionTypes && serverOptionTypes.length > 0) {
        setOptionTypes(
          serverOptionTypes.map((t) => ({
            id: t.id,
            name: t.name,
            values: (t.product_option_values ?? []).map((v) => ({
              id: v.id,
              value: v.value,
            })),
          }))
        );
      }
    }, [serverOptionTypes]);

    const insertTypeMutation = trpc.productOptionTypes.insert.useMutation({ onError: errorToast });
    const deleteTypeMutation = trpc.productOptionTypes.delete.useMutation({ onError: errorToast });
    const insertValueMutation = trpc.productOptionValues.insert.useMutation({ onError: errorToast });
    const deleteValueMutation = trpc.productOptionValues.delete.useMutation({ onError: errorToast });
    const bulkUpsertMutation = trpc.productVariants.bulkUpsert.useMutation({ onError: errorToast });
    const deleteVariantMutation = trpc.productVariants.delete.useMutation({ onError: errorToast });

    // ── Exposed imperative handle ─────────────────────────────────────
    useImperativeHandle(ref, () => ({
      getDraftVariants: () => variants,
      saveVariants: async (pid: string) => {
        if (variants.length === 0) return;
        await bulkUpsertMutation.mutateAsync({
          product_id: pid,
          variants: variants.map((v) => ({
            ...v,
            option_value_ids: v.option_value_ids.filter(isValidUuid),
          })),
        });
      },
    }));

    // ── Option type handlers ──────────────────────────────────────────
    const handleAddOptionType = async () => {
      const name = newTypeName.trim();
      if (!name) return;

      if (isEditMode && productId) {
        const data = await insertTypeMutation.mutateAsync({ product_id: productId, name });
        setOptionTypes((prev) => [...prev, { id: data.id, name: data.name, values: [] }]);
      } else {
        setOptionTypes((prev) => [
          ...prev,
          { id: `local-${Date.now()}`, name, values: [] },
        ]);
      }
      setNewTypeName("");
    };

    const handleDeleteOptionType = async (typeId: string) => {
      if (isEditMode && !typeId.startsWith("local-")) {
        await deleteTypeMutation.mutateAsync({ id: typeId });
      }
      setOptionTypes((prev) => prev.filter((t) => t.id !== typeId));
    };

    const handleAddValue = async (typeId: string) => {
      const raw = newValueInputs[typeId]?.trim();
      if (!raw) return;

      const values = raw.split(",").map((v) => v.trim()).filter(Boolean);
      const newValues: { id: string; value: string }[] = [];

      for (const value of values) {
        if (isEditMode && !typeId.startsWith("local-")) {
          const data = await insertValueMutation.mutateAsync({ option_type_id: typeId, value });
          newValues.push({ id: data.id, value: data.value });
        } else {
          newValues.push({ id: `local-${Date.now()}-${value}`, value });
        }
      }

      setOptionTypes((prev) =>
        prev.map((t) =>
          t.id === typeId ? { ...t, values: [...t.values, ...newValues] } : t
        )
      );
      setNewValueInputs((prev) => ({ ...prev, [typeId]: "" }));
    };

    const handleDeleteValue = async (typeId: string, valueId: string) => {
      if (isEditMode && !valueId.startsWith("local-")) {
        await deleteValueMutation.mutateAsync({ id: valueId });
      }
      setOptionTypes((prev) =>
        prev.map((t) =>
          t.id === typeId
            ? { ...t, values: t.values.filter((v) => v.id !== valueId) }
            : t
        )
      );
    };

    // ── Variant handlers ──────────────────────────────────────────────
    const handleAddVariant = () => {
      const next = [...variants, emptyVariant()];
      setVariants(next);
      setEditingIdx(next.length - 1);
      setExpandedIdx(next.length - 1);
    };

    const handleDeleteVariant = async (idx: number) => {
      const v = variants[idx];
      if (isEditMode && v.id) {
        await deleteVariantMutation.mutateAsync({ id: v.id });
        toast({ title: "Variante eliminada", variant: "success" });
      }
      setVariants((prev) => prev.filter((_, i) => i !== idx));
      setEditingIdx(null);
    };

    const updateVariantField = <K extends keyof DraftVariant>(
      idx: number,
      key: K,
      value: DraftVariant[K]
    ) => {
      setVariants((prev) =>
        prev.map((v, i) => (i === idx ? { ...v, [key]: value } : v))
      );
    };

    const toggleOptionValue = (idx: number, typeId: string, valueId: string) => {
      const type = optionTypes.find((t) => t.id === typeId);
      if (!type) return;

      const typeValueIds = new Set(type.values.map((v) => v.id));
      const current = variants[idx].option_value_ids;
      const withoutThisType = current.filter((id) => !typeValueIds.has(id));
      const isSelected = current.includes(valueId);
      const next = isSelected ? withoutThisType : [...withoutThisType, valueId];

      setVariants((prev) =>
        prev.map((v, i) =>
          i === idx ? { ...v, option_value_ids: next, _label: undefined } : v
        )
      );
    };

    const getVariantLabel = (v: DraftVariant, idx: number) => {
      if (v._label) return v._label;
      const selectedValues = optionTypes.flatMap((t) =>
        t.values
          .filter((val) => v.option_value_ids.includes(val.id))
          .map((val) => `${t.name}: ${val.value}`)
      );
      return selectedValues.length > 0
        ? selectedValues.join(" / ")
        : `Variante ${idx + 1}`;
    };

    const hasOptions = optionTypes.length > 0 && optionTypes.some((t) => t.values.length > 0);

    return (
      <div className="space-y-6">
        {/* ── Opciones del producto ──────────────────────────────────── */}
        <div className="space-y-4">
          <p className="text-sm font-medium text-gray-700">
            Opciones del producto{" "}
            <span className="text-muted-foreground font-normal">
              (ej. Color, Talla, Presentación)
            </span>
          </p>

          {optionTypes.map((type) => (
            <div key={type.id} className="border rounded-lg p-4 space-y-3 bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{type.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive h-7 px-2"
                  onClick={() => handleDeleteOptionType(type.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {type.values.map((val) => (
                  <Badge
                    key={val.id}
                    variant="secondary"
                    className="gap-1 pr-1 cursor-pointer group"
                  >
                    {val.value}
                    <button
                      type="button"
                      onClick={() => handleDeleteValue(type.id, val.id)}
                      className="ml-1 rounded-full hover:bg-red-100 text-muted-foreground hover:text-red-600 transition-colors"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  value={newValueInputs[type.id] ?? ""}
                  onChange={(e) =>
                    setNewValueInputs((prev) => ({ ...prev, [type.id]: e.target.value }))
                  }
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddValue(type.id); } }}
                  placeholder="Agregar valor (separa varios con coma)…"
                  className="h-8 text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => handleAddValue(type.id)}
                >
                  +
                </Button>
              </div>
            </div>
          ))}

          <div className="flex gap-2">
            <Input
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddOptionType(); } }}
              placeholder="Nueva opción (ej. Color, Talla)…"
              className="h-8 text-sm"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 shrink-0"
              onClick={handleAddOptionType}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Añadir opción
            </Button>
          </div>
        </div>

        {/* ── Lista de variantes ─────────────────────────────────────── */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">
            Variantes{" "}
            <span className="text-muted-foreground font-normal">
              (precio, stock e inventario por variante)
            </span>
          </p>

          {variants.map((variant, idx) => {
            const isExpanded = expandedIdx === idx;
            const label = getVariantLabel(variant, idx);

            return (
              <div key={idx} className="border rounded-lg overflow-hidden">
                {/* Header */}
                <div
                  className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                >
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span>{label}</span>
                    {variant.sku && (
                      <span className="text-xs text-muted-foreground font-normal">
                        SKU: {variant.sku}
                      </span>
                    )}
                    <span className="text-xs text-primary font-semibold ml-2">
                      ${variant.price.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={variant.is_active ? "default" : "outline"} className="text-xs">
                      {variant.is_active ? "Activa" : "Inactiva"}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive h-7 w-7 p-0"
                      onClick={(e) => { e.stopPropagation(); handleDeleteVariant(idx); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="p-4 space-y-4 border-t">
                    {/* Options selector */}
                    {hasOptions && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Opciones de esta variante
                        </p>
                        <div className="flex flex-wrap gap-4">
                          {optionTypes.map((type) => (
                            <div key={type.id} className="space-y-1.5">
                              <p className="text-xs text-muted-foreground">{type.name}</p>
                              <div className="flex flex-wrap gap-1.5">
                                {type.values.map((val) => {
                                  const selected = variant.option_value_ids.includes(val.id);
                                  return (
                                    <button
                                      key={val.id}
                                      type="button"
                                      onClick={() => toggleOptionValue(idx, type.id, val.id)}
                                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${selected
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-white text-gray-700 border-gray-300 hover:border-gray-500"
                                        }`}
                                    >
                                      {val.value}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pricing */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Precio *</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={variant.price}
                          onChange={(e) => updateVariantField(idx, "price", +e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Precio comparativo</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={variant.compare_at_price}
                          onChange={(e) => updateVariantField(idx, "compare_at_price", +e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Costo</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={variant.cost}
                          onChange={(e) => updateVariantField(idx, "cost", +e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>

                    {/* Inventory */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">SKU</Label>
                        <Input
                          value={variant.sku}
                          onChange={(e) => updateVariantField(idx, "sku", e.target.value)}
                          placeholder="PROD-001-M-RJ"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Stock</Label>
                        <Input
                          type="number"
                          min={0}
                          value={variant.stock_quantity}
                          onChange={(e) => updateVariantField(idx, "stock_quantity", +e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Umbral stock bajo</Label>
                        <Input
                          type="number"
                          min={0}
                          value={variant.low_stock_threshold}
                          onChange={(e) => updateVariantField(idx, "low_stock_threshold", +e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>

                    {/* Toggles */}
                    <div className="flex flex-wrap gap-6">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={variant.allow_backorder}
                          onCheckedChange={(v) => updateVariantField(idx, "allow_backorder", v)}
                        />
                        <Label className="text-xs cursor-pointer">
                          Pedido sin stock
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={variant.is_active}
                          onCheckedChange={(v) => updateVariantField(idx, "is_active", v)}
                        />
                        <Label className="text-xs cursor-pointer">
                          Variante activa
                        </Label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddVariant}
            className="w-full border-dashed"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar variante
          </Button>
        </div>
      </div>
    );
  }
);

ProductVariantsSection.displayName = "ProductVariantsSection";

export default ProductVariantsSection;
