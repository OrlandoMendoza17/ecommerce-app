"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CurrencyContextValue, StoreCurrency } from "./CurrencyContext.types";

const STORAGE_KEY = "store-currency";

/** Placeholder hasta integrar API de tasa de cambio */
export const PLACEHOLDER_USD_TO_VES_RATE = 36;

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function readStoredCurrency(): StoreCurrency {
  if (typeof window === "undefined") return "USD";
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "VES" ? "VES" : "USD";
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<StoreCurrency>("USD");

  useEffect(() => {
    setCurrencyState(readStoredCurrency());
  }, []);

  const setCurrency = useCallback((next: StoreCurrency) => {
    setCurrencyState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const exchangeRate = PLACEHOLDER_USD_TO_VES_RATE;

  const formatPrice = useCallback(
    (amountUsd: number) => {
      if (currency === "VES") {
        return `Bs. ${(amountUsd * exchangeRate).toFixed(2)}`;
      }
      return `$${amountUsd.toFixed(2)}`;
    },
    [currency, exchangeRate]
  );

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      setCurrency,
      exchangeRate,
      formatPrice,
    }),
    [currency, setCurrency, exchangeRate, formatPrice]
  );

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency debe usarse dentro de CurrencyProvider");
  }
  return context;
}
