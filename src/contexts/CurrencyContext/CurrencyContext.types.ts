export type StoreCurrency = "USD" | "EUR";

export interface CurrencyContextValue {
  currency: StoreCurrency;
  /** Tasa currency → VES. Fallback al placeholder mientras carga. */
  exchangeRate: number;
  /** True mientras se fetcha la tasa por primera vez. */
  isLoadingRate: boolean;
  /** Formatea el monto con el símbolo de la moneda configurada en la tienda. */
  formatPrice: (amount: number) => string;
  /** Formatea el monto equivalente en Bs. usando la tasa de la moneda configurada. */
  formatBsPrice: (amount: number) => string;
}
