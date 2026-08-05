export interface FormattedPriceProps {
  amount: number;
  /** Override de moneda. Por defecto usa la moneda configurada en la tienda. */
  currency?: string;
  /** Si es true, convierte el monto a Bs. con la tasa del contexto. */
  inBs?: boolean;
  className?: string;
  currencyClassName?: string;
  integerClassName?: string;
  separatorClassName?: string;
  fractionClassName?: string;
}
