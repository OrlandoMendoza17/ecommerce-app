"use client";

import { useCurrency } from "@/contexts/CurrencyContext/CurrencyContext";
import type { StoreCurrency } from "@/contexts/CurrencyContext/CurrencyContext.types";
import { cn } from "@/lib/utils";
import { CurrencyToggleProps } from "./CurrencyToggle.types";

const options: { value: StoreCurrency; label: string }[] = [
  { value: "USD", label: "USD" },
  { value: "VES", label: "Bs." },
];

export default function CurrencyToggle({ className = "" }: CurrencyToggleProps) {
  const { currency, setCurrency } = useCurrency();

  return (
    <div
      role="group"
      aria-label="Moneda de visualización"
      className={cn(
        "inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5",
        className
      )}
    >
      {options.map((option) => {
        const isActive = currency === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setCurrency(option.value)}
            className={cn(
              "min-w-[44px] px-3 py-1.5 text-xs font-semibold rounded-md transition-colors",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
            aria-pressed={isActive}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
