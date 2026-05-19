/**
 * Tipos de método de pago permitidos (deben coincidir con el CHECK de payment_methods.type en BD).
 */
export const PAYMENT_METHOD_TYPES = [
  "pago_movil",
  "zinli",
  "zelle",
  "binance",
  "transferencia_bancaria",
] as const;

export type PaymentMethodType = (typeof PAYMENT_METHOD_TYPES)[number];

export interface PaymentMethodBaseInfo {
  id: PaymentMethodType;
  name: string;
  icon: string;
  currency: "USD" | "EUR" | "VES";
  description: string;
}

/**
 * Información base de cada método de pago (nombre, icono, moneda, descripción).
 * El `id` coincide con el valor de la columna `type` en la tabla payment_methods.
 */
export const PAYMENT_METHODS_BASE_INFO: PaymentMethodBaseInfo[] = [
  {
    id: "pago_movil",
    name: "Pago Móvil",
    icon: "https://imgur.com/zfhh0SQ.png",
    currency: "VES",
    description: "Transferencia bancaria móvil",
  },
  {
    id: "zinli",
    name: "Zinli",
    icon: "https://imgur.com/iyiRfm0.png",
    currency: "USD",
    description: "Billetera digital Zinli",
  },
  {
    id: "zelle",
    name: "Zelle",
    icon: "https://imgur.com/CUlTKg3.png",
    currency: "USD",
    description: "Transferencia bancaria Zelle",
  },
  {
    id: "binance",
    name: "Binance",
    icon: "https://imgur.com/Z0yiJcM.png",
    currency: "USD",
    description: "Pago con criptomonedas",
  },
  {
    id: "transferencia_bancaria",
    name: "Transferencia Bancaria",
    icon: "https://i.imgur.com/p66rzDP.png",
    currency: "VES",
    description: "Transferencia con datos de cuenta bancarios",
  },
];

/** Mapa por id/type para búsqueda O(1). */
export const PAYMENT_METHODS_BY_TYPE = PAYMENT_METHODS_BASE_INFO.reduce(
  (acc, info) => {
    acc[info.id] = info;
    return acc;
  },
  {} as Record<PaymentMethodType, PaymentMethodBaseInfo>
);
