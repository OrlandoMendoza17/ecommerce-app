"use client";

import { cn } from "@/lib/utils";
import { useCurrency } from "@/contexts/CurrencyContext/CurrencyContext";
import {
  formatCurrencyWithSymbol,
  getPriceParts,
} from "@/lib/formatters/currency";
import { FormattedPriceProps } from "./FormattedPrice.types";

export default function FormattedPrice({
  amount,
  className,
  currency: currencyProp,
  inBs = false,
}: FormattedPriceProps) {
  const { currency: storeCurrency, exchangeRate } = useCurrency();
  const currency = inBs ? "VES" : (currencyProp ?? storeCurrency);
  const value = inBs ? amount * exchangeRate : amount;
  const parts = getPriceParts(value, currency);

  return (
    <span
      className={cn("FormattedPrice", className)}
      aria-label={formatCurrencyWithSymbol(value, currency)}
    >
      <span className="">
        <span>{parts.currency}</span>
      </span>
      <span className="">
        {parts.integer}
      </span>
      <span className="hidden">
        {parts.separator}
      </span>
      <span className="text-[.625rem] sm:text-xs inline-block align-text-top -mt-0.5 sm:mt-1 ml-px">
        {parts.fraction}
      </span>
    </span>
  );
}
