"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { trpc } from "@/config/trpc.config";
import type { CurrencyContextValue, StoreCurrency } from "./CurrencyContext.types";
import { formatStorePrice, formatBsPrice as formatBsPriceUtil } from "@/lib/formatters/currency";

/** Fallback mientras la tasa real no está disponible */
export const PLACEHOLDER_RATE = 36;

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { data: settings } = trpc.storeSettings.get.useQuery(undefined, {
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const { data: rateData, isLoading: isLoadingRate } =
    trpc.exchange_rates.select.useQuery(
      {},
      {
        refetchOnWindowFocus: false,
        staleTime: 1000 * 60 * 60, // 1 hora — el cron actualiza 1×/día
      }
    );

  const currency = useMemo<StoreCurrency>(() => {
    const raw = settings?.currency?.toUpperCase();
    return raw === "EUR" ? "EUR" : "USD";
  }, [settings?.currency]);

  const exchangeRate = useMemo(() => {
    if (!rateData) return PLACEHOLDER_RATE;
    const rate = currency === "EUR" ? rateData.EUR : rateData.USD;
    return rate ? Number(rate) : PLACEHOLDER_RATE;
  }, [rateData, currency]);

  const formatPrice = useCallback(
    (amount: number) => formatStorePrice(amount, currency),
    [currency],
  );

  const formatBsPrice = useCallback(
    (amount: number) => formatBsPriceUtil(amount, exchangeRate),
    [exchangeRate],
  );

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      exchangeRate,
      isLoadingRate,
      formatPrice,
      formatBsPrice,
    }),
    [currency, exchangeRate, isLoadingRate, formatPrice, formatBsPrice]
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
