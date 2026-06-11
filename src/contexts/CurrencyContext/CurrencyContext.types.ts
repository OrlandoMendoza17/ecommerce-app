export type StoreCurrency = "USD" | "VES";

export interface CurrencyContextValue {
  currency: StoreCurrency;
  setCurrency: (currency: StoreCurrency) => void;
  /** USD → VES rate. Falls back to placeholder while loading or if unavailable. */
  exchangeRate: number;
  /** True while the live exchange rate is being fetched for the first time. */
  isLoadingRate: boolean;
  formatPrice: (amountUsd: number) => string;
}
