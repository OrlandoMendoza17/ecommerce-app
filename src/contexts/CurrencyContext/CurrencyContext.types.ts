export type StoreCurrency = "USD" | "VES";

export interface CurrencyContextValue {
  currency: StoreCurrency;
  setCurrency: (currency: StoreCurrency) => void;
  exchangeRate: number;
  formatPrice: (amountUsd: number) => string;
}
