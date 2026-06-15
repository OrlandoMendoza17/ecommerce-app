"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { trpc } from "@/config/trpc.config";
import type { CurrencyContextValue, StoreCurrency } from "./CurrencyContext.types";
import { formatStorePrice } from "@/lib/formatters/currency";

const STORAGE_KEY = "store-currency";

/** Fallback mientras la tasa real no está disponible */
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

  const { data: rateData, isLoading: isLoadingRate } =
    trpc.exchange_rates.select.useQuery(
      {},
      {
        refetchOnWindowFocus: false,
        staleTime: 1000 * 60 * 60, // 1 hora — el cron actualiza 1×/día
      }
    );

  const exchangeRate = useMemo(
    () =>
      rateData?.USD ? Number(rateData.USD) : PLACEHOLDER_USD_TO_VES_RATE,
    [rateData]
  );

  const formatPrice = useCallback(
    (amountUsd: number) => formatStorePrice(amountUsd, currency, exchangeRate),
    [currency, exchangeRate],
  );

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      setCurrency,
      exchangeRate,
      isLoadingRate,
      formatPrice,
    }),
    [currency, setCurrency, exchangeRate, isLoadingRate, formatPrice]
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
