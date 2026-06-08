/** Contacto de la tienda (placeholder hasta tabla de configuración en BD). */
export const STORE_CONTACT = {
  sellerWhatsApp: "584121234567",
  displayPhone: "+58 412-1234567",
  storeName: "Mi Tienda",
  storeHandle: "ECOMMERCE_APP",
  followersLabel: "+510 seguidores",
  social: {
    instagram: "https://instagram.com",
    facebook: "https://facebook.com",
    tiktok: "https://tiktok.com",
  },
} as const;

export function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
