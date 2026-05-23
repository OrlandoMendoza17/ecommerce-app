export const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount);
};