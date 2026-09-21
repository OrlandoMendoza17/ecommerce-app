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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/formatters/currency";
import { Loader2, TrendingDown, TrendingUp } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  onConfirm: (config: {
    mode: "percentage" | "fixed";
    amount: number;
    target: "price" | "compare_at_price" | "both";
    roundTo99: boolean;
  }) => Promise<void>;
}

export default function BulkPriceAdjustModal({
  open,
  onOpenChange,
  count,
  onConfirm,
}: Props) {
  const [operation, setOperation] = useState<"increase" | "discount">("discount");
  const [mode, setMode] = useState<"percentage" | "fixed">("percentage");
  const [amountValue, setAmountValue] = useState<string>("10");
  const [target, setTarget] = useState<"price" | "compare_at_price" | "both">("price");
  const [roundTo99, setRoundTo99] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const parsedAmount = Math.abs(parseFloat(amountValue) || 0);
  const signedAmount = operation === "discount" ? -parsedAmount : parsedAmount;

  const calculateExample = (current: number) => {
    let result = current;
    if (mode === "percentage") {
      result = current * (1 + signedAmount / 100);
    } else {
      result = current + signedAmount;
    }
    result = Math.max(0, result);
    if (roundTo99) {
      result = Math.floor(result) + 0.99;
      if (result < 0.99) result = 0.99;
    } else {
      result = Math.round(result * 100) / 100;
    }
    return result;
  };

  const handleApply = async () => {
    if (parsedAmount <= 0) return;
    try {
      setLoading(true);
      await onConfirm({
        mode,
        amount: signedAmount,
        target,
        roundTo99,
      });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Ajuste masivo de precios</DialogTitle>
          <DialogDescription>
            Aplica un incremento o descuento a los <strong>{count}</strong>{" "}
            {count === 1 ? "producto seleccionado" : "productos seleccionados"}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Tipo de operación: Aumento o Descuento */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={operation === "discount" ? "default" : "outline"}
              className="gap-2"
              onClick={() => setOperation("discount")}
            >
              <TrendingDown className="size-4" />
              Descuento / Rebaja
            </Button>
            <Button
              type="button"
              variant={operation === "increase" ? "default" : "outline"}
              className="gap-2"
              onClick={() => setOperation("increase")}
            >
              <TrendingUp className="size-4" />
              Incremento de precio
            </Button>
          </div>

          {/* Modo: Porcentaje o Monto Fijo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Modalidad</Label>
              <Select
                value={mode}
                onValueChange={(val: "percentage" | "fixed") => setMode(val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                  <SelectItem value="fixed">Monto fijo ($ USD)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">
                {mode === "percentage" ? "Valor (%)" : "Monto ($)"}
              </Label>
              <Input
                type="number"
                min="0"
                step={mode === "percentage" ? "1" : "0.5"}
                value={amountValue}
                onChange={(e) => setAmountValue(e.target.value)}
                placeholder={mode === "percentage" ? "10" : "5.00"}
              />
            </div>
          </div>

          {/* Campo objetivo */}
          <div className="space-y-1.5">
            <Label className="text-xs">Aplicar ajuste sobre</Label>
            <Select
              value={target}
              onValueChange={(val: "price" | "compare_at_price" | "both") =>
                setTarget(val)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price">Solo Precio regular</SelectItem>
                <SelectItem value="compare_at_price">
                  Solo Precio de comparación (Tachado)
                </SelectItem>
                <SelectItem value="both">Ambos precios</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Redondeo a .99 */}
          <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/40">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium cursor-pointer" htmlFor="round-99">
                Redondear a .99
              </Label>
              <p className="text-xs text-muted-foreground">
                Termina los precios en .99 (ej. $19.99 en vez de $20.00)
              </p>
            </div>
            <Switch
              id="round-99"
              checked={roundTo99}
              onCheckedChange={setRoundTo99}
            />
          </div>

          {/* Vista previa en tiempo real */}
          <div className="rounded-lg bg-muted p-3 text-xs space-y-1.5 border">
            <p className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
              Ejemplos de cálculo estimado:
            </p>
            <div className="flex justify-between items-center text-foreground">
              <span>Producto de {formatCurrency(25)}:</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                ➔ {formatCurrency(calculateExample(25))}
              </span>
            </div>
            <div className="flex justify-between items-center text-foreground">
              <span>Producto de {formatCurrency(100)}:</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                ➔ {formatCurrency(calculateExample(100))}
              </span>
            </div>
          </div>
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
          <Button
            type="button"
            onClick={handleApply}
            disabled={loading || parsedAmount <= 0}
          >
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Aplicar ajuste a {count} productos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
