"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/hooks/useToast";
import { ShoppingCart, Minus, Plus } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext/CurrencyContext";
import { useCart } from "@/contexts/CartContext/CartContext";
import { trpc } from "@/config/trpc.config";
import ProductHeader from "@/components/pages/productos/ProductHeader/ProductHeader";
import ProductStockBadge from "@/components/pages/productos/ProductStockBadge/ProductStockBadge";
import { ProductInfoProps } from "./ProductInfo.types";
import type { VariantWithOptions } from "@/trpc/routes/product_variants.router";

const isValidUuid = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

type OptionTypeUI = {
  id: string;
  name: string;
  values: Map<string, string>;
};

export default function ProductInfo({ product, className = "" }: ProductInfoProps) {
  const { formatPrice, formatBsPrice } = useCurrency();
  const { toast } = useToast();
  const { addItem, items } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [lastCartAction, setLastCartAction] = useState<"add" | "update">("add");

  // Track selected option values per option type: { typeName: valueId }
  const [selectedOptionValues, setSelectedOptionValues] = useState<Record<string, string>>({});
  const hasInitializedOptions = useRef(false);

  // Load variants only when product has a real UUID
  const hasRealId = isValidUuid(product.id);
  const { data: variants = [] } = trpc.productVariants.selectByProduct.useQuery(
    { product_id: product.id, is_active: true },
    { enabled: hasRealId }
  );

  const { data: serverOptionTypes = [] } = trpc.productOptionTypes.selectByProduct.useQuery(
    { product_id: product.id },
    { enabled: hasRealId }
  );

  // Option types from catalog (primary) + variant links (fallback)
  const optionTypes = useMemo<OptionTypeUI[]>(() => {
    const map = new Map<string, OptionTypeUI>();

    for (const t of serverOptionTypes) {
      const values = new Map<string, string>();
      for (const v of t.product_option_values ?? []) {
        values.set(v.id, v.value);
      }
      if (values.size > 0) {
        map.set(t.name, { id: t.id, name: t.name, values });
      }
    }

    for (const variant of variants) {
      for (const opt of variant.options) {
        if (!opt.type_name) continue;
        if (!map.has(opt.type_name)) {
          map.set(opt.type_name, {
            id: opt.type_name,
            name: opt.type_name,
            values: new Map(),
          });
        }
        map.get(opt.type_name)!.values.set(opt.option_value_id, opt.value);
      }
    }

    return Array.from(map.values());
  }, [serverOptionTypes, variants]);

  const defaultVariant = variants.length > 0 ? variants[0] : null;

  useEffect(() => {
    if (hasInitializedOptions.current) return;
    if (!defaultVariant) return;

    if (optionTypes.length === 0) {
      hasInitializedOptions.current = true;
      return;
    }

    const variantValueIds =
      defaultVariant.option_value_ids?.length > 0
        ? defaultVariant.option_value_ids
        : defaultVariant.options.map((o) => o.option_value_id);

    const initial: Record<string, string> = {};
    for (const type of optionTypes) {
      const matchId = Array.from(type.values.keys()).find((id) =>
        variantValueIds.includes(id)
      );
      if (matchId) initial[type.name] = matchId;
    }

    if (Object.keys(initial).length > 0) {
      setSelectedOptionValues(initial);
    }

    hasInitializedOptions.current = true;
  }, [defaultVariant, optionTypes]);

  // valueId → typeName — needed to identify which values belong to which type
  const valueToTypeName = useMemo(() => {
    const map = new Map<string, string>();
    for (const type of optionTypes) {
      for (const [valueId] of type.values.entries()) {
        map.set(valueId, type.name);
      }
    }
    return map;
  }, [optionTypes]);

  // Helper: for a given type, return the set of valueIds that appear in
  // at least one active variant that also contains every currently selected
  // value from OTHER types.
  const getCompatibleIds = (
    forTypeName: string,
    currentSel: Record<string, string>
  ): Set<string> => {
    const result = new Set<string>();
    for (const variant of variants) {
      const ids =
        variant.option_value_ids?.length > 0
          ? variant.option_value_ids
          : variant.options.map((o) => o.option_value_id);

      const otherSelectionsMatch = optionTypes.every((ot) => {
        if (ot.name === forTypeName) return true;
        const sel = currentSel[ot.name];
        return !sel || ids.includes(sel);
      });

      if (otherSelectionsMatch) {
        for (const id of ids) {
          if (valueToTypeName.get(id) === forTypeName) result.add(id);
        }
      }
    }
    return result;
  };

  // For each type, which values are compatible given OTHER current selections?
  const compatibleValuesByType = useMemo((): Map<string, Set<string>> => {
    const result = new Map<string, Set<string>>();
    for (const type of optionTypes) {
      result.set(type.name, getCompatibleIds(type.name, selectedOptionValues));
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variants, optionTypes, selectedOptionValues, valueToTypeName]);

  // Smart select: when user picks a value, auto-adjust other types so the
  // overall selection always points to a valid variant.
  const handleSelectOption = (typeName: string, valueId: string) => {
    let newSel: Record<string, string> = { ...selectedOptionValues, [typeName]: valueId };

    for (const type of optionTypes) {
      if (type.name === typeName) continue;

      const compatible = getCompatibleIds(type.name, newSel);
      const currentVal = newSel[type.name];

      if (currentVal && !compatible.has(currentVal)) {
        // Current selection for this type is no longer compatible — pick the
        // first compatible value ordered by how they appear in the type list.
        const first = Array.from(type.values.keys()).find((id) =>
          compatible.has(id)
        );
        if (first) {
          newSel = { ...newSel, [type.name]: first };
        } else {
          const { [type.name]: _removed, ...rest } = newSel;
          newSel = rest;
        }
      } else if (!currentVal && compatible.size > 0) {
        // Nothing selected yet for this type — auto-pick the first compatible.
        const first = Array.from(type.values.keys()).find((id) =>
          compatible.has(id)
        );
        if (first) newSel = { ...newSel, [type.name]: first };
      }
    }

    setSelectedOptionValues(newSel);
  };

  const selectedIds = useMemo(
    () =>
      optionTypes
        .map((t) => selectedOptionValues[t.name])
        .filter((id): id is string => Boolean(id)),
    [optionTypes, selectedOptionValues]
  );

  const allOptionsSelected =
    optionTypes.length === 0 || selectedIds.length === optionTypes.length;

  const { data: matchedVariant } = trpc.productVariants.findByOptionValues.useQuery(
    { product_id: product.id, option_value_ids: selectedIds },
    {
      enabled:
        hasRealId &&
        optionTypes.length > 0 &&
        allOptionsSelected &&
        selectedIds.length > 0,
    }
  );

  const selectedVariant = useMemo<VariantWithOptions | null>(() => {
    if (matchedVariant) return matchedVariant;
    if (variants.length === 0) return null;
    if (optionTypes.length === 0) return defaultVariant;
    if (!allOptionsSelected) return null;

    const selectedSet = new Set(selectedIds);
    return (
      variants.find((v) => {
        const ids =
          v.option_value_ids?.length > 0
            ? v.option_value_ids
            : v.options.map((o) => o.option_value_id);
        return (
          ids.length === optionTypes.length &&
          ids.every((id) => selectedSet.has(id))
        );
      }) ?? null
    );
  }, [matchedVariant, variants, optionTypes, allOptionsSelected, selectedIds, defaultVariant]);

  const displayVariant = selectedVariant ?? defaultVariant;

  const displayPrice = displayVariant?.price ?? product.price;
  const displayComparePrice = displayVariant?.compare_at_price ?? product.compare_at_price;
  const stockQty = displayVariant?.available_quantity ?? displayVariant?.stock_quantity ?? 0;
  const allowBackorder = displayVariant?.allow_backorder ?? false;
  const lowStockThreshold =
    displayVariant?.low_stock_threshold && displayVariant.low_stock_threshold > 0
      ? displayVariant.low_stock_threshold
      : 5;

  const inCartQty = useMemo(() => {
    if (!displayVariant) return 0;
    return items
      .filter((item) => item.variantId === displayVariant.id)
      .reduce((sum, item) => sum + item.quantity, 0);
  }, [items, displayVariant]);

  const hasDiscount = displayComparePrice > 0 && displayComparePrice > displayPrice;
  const discountPercentage = hasDiscount
    ? Math.round(((displayComparePrice - displayPrice) / displayComparePrice) * 100)
    : 0;

  // const averageRating = 4.7;
  // const reviewCount = 23;

  const requiresVariant = hasRealId && variants.length > 0;
  const canAddToCart =
    allOptionsSelected &&
    (!requiresVariant || selectedVariant !== null) &&
    stockQty > 0 &&
    quantity >= 1 &&
    (allowBackorder || quantity <= stockQty);

  useEffect(() => {
    setQuantity(inCartQty > 0 ? inCartQty : 1);
  }, [displayVariant?.id, inCartQty]);

  useEffect(() => {
    if (allowBackorder) return;
    setQuantity((current) => Math.min(current, stockQty));
  }, [stockQty, allowBackorder, displayVariant?.id]);

  const buildVariantOptionsForCart = (variant: VariantWithOptions) => {
    if (variant.options.length > 0) {
      return variant.options.map((o) => ({
        type_name: o.type_name,
        value: o.value,
      }));
    }

    return optionTypes
      .map((type) => {
        const valueId = selectedOptionValues[type.name];
        const value = valueId ? type.values.get(valueId) : undefined;
        return value ? { type_name: type.name, value } : null;
      })
      .filter((o): o is { type_name: string; value: string } => o !== null);
  };

  const handleAddToCart = async () => {
    const variantToAdd = selectedVariant;

    if (!variantToAdd || !canAddToCart) return;

    try {
      setLastCartAction(inCartQty > 0 ? "update" : "add");

      await addItem(
        {
          id: product.id,
          name: product.name,
          slug: product.slug,
          images: product.images,
          variantId: variantToAdd.id,
          variantPrice: variantToAdd.price,
          variantStockQuantity: variantToAdd.available_quantity,
          allowBackorder: variantToAdd.allow_backorder,
          variantImages: variantToAdd.images,
          variantOptions: buildVariantOptionsForCart(variantToAdd),
        },
        quantity
      );

      setAddedFeedback(true);
      setTimeout(() => setAddedFeedback(false), 1500);
    } catch (error) {
      toast({
        title: "Stock insuficiente",
        description:
          error instanceof Error
            ? error.message
            : "No hay suficientes unidades disponibles",
        variant: "error",
      });
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleIncrement = () => {
    if (allowBackorder || quantity < stockQty) setQuantity(quantity + 1);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <ProductHeader
        name={product.name}
        stockQuantity={stockQty}
        lowStockThreshold={lowStockThreshold}
        className="hidden lg:block"
      />

      {/* Price */}
      <div className="border-gray-200">
        <div className="flex items-baseline flex-wrap gap-3">
          <div>
            {
              hasDiscount &&
              <span className="text-base leading-4  text-gray-500 line-through block">
                {formatPrice(displayComparePrice)}
              </span>
            }
            <div className="flex items-center gap-2">
              <span className="text-[1.75rem] leading-9 font-bold text-gray-900">
                {formatPrice(displayPrice)}
              </span>
              {hasDiscount && (
                <div className="flex items-center gap-2">
                  <div className="bg-emerald-500 text-white text-xs font-bold px-0.5 py-0.25">
                    -{discountPercentage}% OFF
                  </div>
                </div>
              )}
            </div>
            <p className="text-lg leading-4.5 mt-0.5 font-normal">
              {formatBsPrice(displayPrice)}
            </p>
          </div>

        </div>
      </div>

      {/* Variant Option Selectors */}
      {optionTypes.length > 0 && (
        <div className="space-y-5">
          {optionTypes.map((type) => {
            const compatible = compatibleValuesByType.get(type.name) ?? new Set<string>();
            const hasOtherSelections = optionTypes.some(
              (ot) => ot.name !== type.name && selectedOptionValues[ot.name]
            );

            return (
              <div key={type.id}>
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  {type.name}
                  {selectedOptionValues[type.name] && (
                    <span className="font-normal text-gray-500 ml-1">
                      — {type.values.get(selectedOptionValues[type.name]!)}
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  {Array.from(type.values.entries()).map(([valueId, value]) => {
                    const isSelected = selectedOptionValues[type.name] === valueId;
                    // Only dim when there are other selections that constrain this type
                    const isUnavailable = hasOtherSelections && !compatible.has(valueId);

                    return (
                      <button
                        key={valueId}
                        type="button"
                        onClick={() => handleSelectOption(type.name, valueId)}
                        title={isUnavailable ? "No disponible con la selección actual" : undefined}
                        className={`relative px-4 py-2 text-sm rounded-lg border-2 font-medium transition-all ${isSelected
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : isUnavailable
                            ? "border-gray-200 text-gray-400 opacity-50 hover:opacity-75 hover:border-gray-300"
                            : "border-gray-300 text-gray-700 hover:border-primary/60 hover:bg-primary/5"
                          }`}
                      >
                        {isUnavailable && (
                          <span
                            className="absolute inset-x-2 top-1/2 h-px bg-gray-400 opacity-60 -translate-y-px pointer-events-none"
                            aria-hidden
                          />
                        )}
                        {value}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {allOptionsSelected && requiresVariant && !selectedVariant && (
            <p className="text-sm text-red-600 font-medium">
              Esta combinación no está disponible. Prueba otras opciones.
            </p>
          )}
        </div>
      )}

      {/* Stock Status — mobile */}
      <ProductStockBadge
        quantity={stockQty}
        lowStockThreshold={lowStockThreshold}
        className="lg:hidden"
      />

      {/* Quantity Selector */}
      {stockQty > 0 && (
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Cantidad en carrito
          </label>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleDecrement}
              disabled={quantity <= 1}
              className="w-10 h-10 flex items-center justify-center border-2 border-gray-300 rounded-lg hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
            <button
              onClick={handleIncrement}
              disabled={!allowBackorder && quantity >= stockQty}
              className="w-10 h-10 flex items-center justify-center border-2 border-gray-300 rounded-lg hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3 pt-4">
        {stockQty > 0 ? (
          <>
            <button
              onClick={handleAddToCart}
              disabled={!canAddToCart}
              className={`w-full font-semibold py-4 rounded-lg flex items-center justify-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${addedFeedback
                ? "bg-green-600 text-white"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
                }`}
            >
              <ShoppingCart className="h-5 w-5" />
              <span>
                {addedFeedback
                  ? lastCartAction === "update"
                    ? "¡Carrito actualizado!"
                    : "¡Agregado al carrito!"
                  : !canAddToCart
                    ? "Selecciona las opciones"
                    : inCartQty > 0
                      ? "Actualizar carrito"
                      : "Añadir al carrito"}
              </span>
            </button>
          </>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-800 font-semibold">Este producto está agotado</p>
            <p className="text-red-600 text-sm mt-1">
              Contáctanos para conocer disponibilidad
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
