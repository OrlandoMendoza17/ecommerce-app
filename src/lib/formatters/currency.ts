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

/** Código interno → símbolo gráfico de moneda para UI: US$, €, Bs. */
export function getCurrencySymbol(currency: string): string {
  switch ((currency || "USD").toUpperCase()) {
    case "USD":
      return "US$";
    case "EUR":
      return "€";
    case "VES":
      return "Bs.";
    default:
      return (currency || "USD").toUpperCase();
  }
}

/** Formatea un monto con símbolo gráfico (no código ISO) y notación decimal europea. */
export function formatCurrencyWithSymbol(amount: number, currency: string = "USD"): string {
  return `${getCurrencySymbol(currency)} ${formatDecimal(amount)}`;
}

/** Formatea un número con separadores europeos (sin símbolo de moneda). */
export function formatDecimal(value: number, fractionDigits = 2): string {
  return new Intl.NumberFormat(EUROPEAN_NUMBER_LOCALE, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

export type PriceParts = {
  currency: string;
  integer: string;
  separator: string;
  fraction: string;
};

/** Descompone un monto en partes listas para renderizar (moneda | enteros | separador | decimales). */
export function getPriceParts(
  amount: number,
  currency: string = "USD",
  fractionDigits = 2,
): PriceParts {
  const formatted = formatDecimal(amount, fractionDigits);
  const separator = ",";
  const [integer, fraction = "0".repeat(fractionDigits)] = formatted.split(separator);

  return {
    currency: getCurrencySymbol(currency),
    integer,
    separator,
    fraction,
  };
}

/** Formatea un monto con símbolo de moneda a la izquierda y notación europea. */
export const formatCurrency = (amount: number, currency: string = "USD"): string => {
  return formatCurrencyWithSymbol(amount, currency);
};

/**
 * Precio principal de catálogo según la moneda configurada en la tienda.
 * El monto se almacena en USD; se muestra con el símbolo de la moneda configurada.
 */
export function formatStorePrice(
  amount: number,
  displayCurrency: "USD" | "EUR",
): string {
  return formatCurrency(amount, displayCurrency);
}

/**
 * Precio equivalente en bolívares (VES).
 * Usa la tasa de cambio correspondiente a la moneda configurada en la tienda.
 */
export function formatBsPrice(amount: number, exchangeRate: number): string {
  return formatCurrency(amount * exchangeRate, "VES");
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

/** Leyenda de tasa de pago: "1 USD = 36,50 Bs." */
export function formatExchangeRateCaption(
  rate: number,
  targetCurrency: string,
): string {
  return `1 USD = ${formatRate(rate)} ${getCurrencyDisplayLabel(targetCurrency)}`;
}

/** Leyenda de tasa del día según moneda configurada en la tienda. */
export function formatStoreExchangeRateCaption(
  rate: number,
  sourceCurrency: "USD" | "EUR",
): string {
  return `1 ${getCurrencyDisplayLabel(sourceCurrency)} = ${formatRate(rate)} Bs.`;
}
