export const STORE_SETTINGS_QUERY_OPTIONS = {
  staleTime: 5 * 60_000,
  gcTime: 30 * 60_000,
} as const;

export const STORE_SETTINGS_FALLBACK = {
  site_name: "Mi Tienda",
  site_tagline: "Envíos a todo el país · Pagos flexibles",
  support_email: "",
  support_phone: "",
  whatsapp_number: "",
  footer_text: "© 2026 Mi Tienda. Todos los derechos reservados.",
  social_instagram: "",
  social_facebook: "",
  social_tiktok: "",
} as const;

export type PublicStoreSettings = {
  siteName: string;
  siteTagline: string;
  logoUrl: string;
  supportEmail: string;
  supportPhone: string;
  whatsappNumber: string;
  footerText: string;
  social: {
    instagram: string;
    facebook: string;
    tiktok: string;
  };
};

export function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function mapPublicStoreSettings(
  settings?: StoreSettings | null
): PublicStoreSettings {
  return {
    siteName: settings?.site_name?.trim() || STORE_SETTINGS_FALLBACK.site_name,
    siteTagline: settings?.site_tagline?.trim() || STORE_SETTINGS_FALLBACK.site_tagline,
    logoUrl: settings?.logo_url?.trim() ?? "",
    supportEmail: settings?.support_email?.trim() ?? "",
    supportPhone: settings?.support_phone?.trim() ?? "",
    whatsappNumber: settings?.whatsapp_number?.trim() ?? "",
    footerText: settings?.footer_text?.trim() || STORE_SETTINGS_FALLBACK.footer_text,
    social: {
      instagram: settings?.social_instagram?.trim() ?? "",
      facebook: settings?.social_facebook?.trim() ?? "",
      tiktok: settings?.social_tiktok?.trim() ?? "",
    },
  };
}

export function formatWhatsAppDisplayPhone(whatsappNumber: string, fallbackPhone: string): string {
  if (fallbackPhone.trim()) return fallbackPhone.trim();
  const digits = whatsappNumber.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("58") && digits.length >= 12) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 5)}-${digits.slice(5)}`;
  }
  return `+${digits}`;
}
