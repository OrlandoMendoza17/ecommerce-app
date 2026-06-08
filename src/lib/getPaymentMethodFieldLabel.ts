const LABELS: Record<string, string> = {
  phone: "Teléfono",
  cedula: "Cédula",
  bank_name: "Banco",
  email: "Email",
  account_number: "Número de cuenta",
  wallet_address: "Dirección de billetera",
  name: "Nombre",
  account_type: "Tipo de cuenta",
};

export function getPaymentMethodFieldLabel(key: string): string {
  return LABELS[key] ?? key.replace(/_/g, " ");
}
