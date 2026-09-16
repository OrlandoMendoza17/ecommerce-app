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
        "flex items-center gap-1 rounded-md border border-border bg-muted/90",
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
            "animate-pulse rounded bg-muted-foreground/20",
            variant === "inline" ? "h-3 w-16" : "h-3.5 w-28"
          )}
          aria-hidden
        />
      ) : (
        <p
          className={cn(
            "font-medium leading-none tabular-nums whitespace-nowrap text-foreground",
            variant === "inline" ? "text-[10px]" : "text-xs"
          )}
        >
          <span className="text-muted-foreground">1{currencySymbol}</span>
          <span className="mx-0.5 text-muted-foreground/60" aria-hidden>
            =
          </span>
          <span className="font-semibold text-primary">{rateFormatted}</span>
          <span className="ml-0.5 text-muted-foreground">Bs.</span>
        </p>
      )}
    </div>
  );
}
