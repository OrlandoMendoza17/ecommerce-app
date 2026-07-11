"use client";

import { ArrowRightLeft } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext/CurrencyContext";
import { formatRate, formatStoreExchangeRateCaption } from "@/lib/formatters/currency";
import { cn } from "@/lib/utils";

interface HeaderExchangeRateProps {
  className?: string;
  variant?: "inline" | "menu";
}

export default function HeaderExchangeRate({
  className = "",
  variant = "inline",
}: HeaderExchangeRateProps) {
  const { currency, exchangeRate, isLoadingRate } = useCurrency();

  const caption = formatStoreExchangeRateCaption(exchangeRate, currency);
  const rateFormatted = formatRate(exchangeRate);
  const currencySymbol = currency === "USD" ? "$" : "€";

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50/90",
        variant === "inline" && "px-1.5 py-0.5",
        variant === "menu" && "w-full justify-center px-3 py-2",
        className
      )}
      title={caption}
      aria-label={`Tasa del día: ${caption}`}
    >
      <ArrowRightLeft
        className={cn(
          "shrink-0 text-primary",
          variant === "inline" ? "h-3 w-3" : "h-3.5 w-3.5"
        )}
        aria-hidden
      />

      {isLoadingRate ? (
        <div
          className={cn(
            "animate-pulse rounded bg-gray-200",
            variant === "inline" ? "h-3 w-16" : "h-3.5 w-28"
          )}
          aria-hidden
        />
      ) : (
        <p
          className={cn(
            "font-medium leading-none text-gray-700 tabular-nums whitespace-nowrap",
            variant === "inline" ? "text-[10px]" : "text-xs"
          )}
        >
          <span className="text-gray-500">1{currencySymbol}</span>
          <span className="mx-0.5 text-gray-300" aria-hidden>
            =
          </span>
          <span className="font-semibold text-primary">{rateFormatted}</span>
          <span className="ml-0.5 text-gray-500">Bs.</span>
        </p>
      )}
    </div>
  );
}
