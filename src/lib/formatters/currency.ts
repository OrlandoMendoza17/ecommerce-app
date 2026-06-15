/** Locale para notación decimal europea: miles con punto, decimales con coma. */
export const EUROPEAN_NUMBER_LOCALE = "es-ES";

/** Código interno (BD/lógica) → etiqueta visible. VES solo en backend; en UI es Bs. */
export function getCurrencyDisplayLabel(currency: string): string {
  switch ((currency || "USD").toUpperCase()) {
    case "VES":
      return "Bs.";
    case "USD":
      return "USD";
    case "EUR":
      return "EUR";
    default:
      return currency || "USD";
  }
}

/** Formatea un número con separadores europeos (sin símbolo de moneda). */
export function formatDecimal(value: number, fractionDigits = 2): string {
  return new Intl.NumberFormat(EUROPEAN_NUMBER_LOCALE, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

/** Formatea un monto con símbolo de moneda y notación europea. */
export const formatCurrency = (amount: number, currency: string = "USD"): string => {
  const code = (currency || "USD").toUpperCase();

  if (code === "VES") {
    return `${getCurrencyDisplayLabel("VES")} ${formatDecimal(amount)}`;
  }

  try {
    return new Intl.NumberFormat(EUROPEAN_NUMBER_LOCALE, {
      style: "currency",
      currency: code,
    }).format(amount);
  } catch {
    return `${getCurrencyDisplayLabel(code)} ${formatDecimal(amount)}`;
  }
};

/**
 * Precio de catálogo según moneda seleccionada en la tienda (USD base).
 */
export function formatStorePrice(
  amountUsd: number,
  displayCurrency: "USD" | "VES",
  exchangeRate: number,
): string {
  if (displayCurrency === "VES") {
    return formatCurrency(amountUsd * exchangeRate, "VES");
  }
  return formatCurrency(amountUsd, "USD");
}

/**
 * Formatea un monto usando la moneda de pago capturada en la orden.
 * Si el pago aún no fue reportado (paid_total === 0), muestra el monto base en USD.
 */
export const formatPaidAmount = (
  paidAmount: number,
  paymentCurrency: string,
  fallbackUsd: number,
): string => {
  if (paidAmount > 0 && paymentCurrency) {
    return formatCurrency(paidAmount, paymentCurrency);
  }
  return formatCurrency(fallbackUsd, "USD");
};

/** Tasa de cambio u otros números sin moneda, con notación europea. */
export function formatRate(value: number, fractionDigits = 2): string {
  return formatDecimal(value, fractionDigits);
}

/** Leyenda de tasa: "1 USD = 36,50 Bs." */
export function formatExchangeRateCaption(
  rate: number,
  targetCurrency: string,
): string {
  return `1 USD = ${formatRate(rate)} ${getCurrencyDisplayLabel(targetCurrency)}`;
}
