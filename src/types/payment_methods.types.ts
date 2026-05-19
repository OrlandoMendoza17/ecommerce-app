interface PaymentMethod extends Tables<"payment_methods"> {
  type: "pago_movil" | "zinli" | "zelle" | "binance" | "transferencia_bancaria";
  payment_details: Record<string, string>;
  is_active: boolean;
}
