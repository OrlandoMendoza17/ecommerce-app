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
  currency: "USD" | "EUR";
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
  const rawCurrency = settings?.currency?.toUpperCase();
  return {
    siteName: settings?.site_name?.trim() || STORE_SETTINGS_FALLBACK.site_name,
    siteTagline: settings?.site_tagline?.trim() || STORE_SETTINGS_FALLBACK.site_tagline,
    logoUrl: settings?.logo_url?.trim() ?? "",
    currency: rawCurrency === "EUR" ? "EUR" : "USD",
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

export type ContactMethodKind = "email" | "phone" | "whatsapp" | "instagram";

export type PublicContactMethod = {
  kind: ContactMethodKind;
  label: string;
  value: string;
  href: string;
};

/** Normaliza handle o URL de Instagram a URL absoluta + label de display. */
export function normalizeInstagramProfile(raw: string): { href: string; display: string } | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let href = trimmed;
  let handle = trimmed;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const segment = url.pathname.replace(/^\/+|\/+$/g, "").split("/")[0] ?? "";
      handle = segment ? `@${segment.replace(/^@/, "")}` : trimmed;
      href = trimmed;
    } catch {
      return null;
    }
  } else {
    const slug = trimmed.replace(/^@/, "").replace(/^instagram\.com\//i, "").replace(/\/+$/, "");
    if (!slug) return null;
    handle = `@${slug}`;
    href = `https://instagram.com/${slug}`;
  }

  return { href, display: handle };
}

export function buildContactMethods(store: PublicStoreSettings): PublicContactMethod[] {
  const methods: PublicContactMethod[] = [];

  if (store.supportEmail) {
    methods.push({
      kind: "email",
      label: "Email",
      value: store.supportEmail,
      href: `mailto:${store.supportEmail}`,
    });
  }

  if (store.supportPhone) {
    const telDigits = store.supportPhone.replace(/\D/g, "");
    methods.push({
      kind: "phone",
      label: "Teléfono",
      value: store.supportPhone,
      href: telDigits ? `tel:+${telDigits}` : `tel:${store.supportPhone}`,
    });
  }

  if (store.whatsappNumber) {
    const href = buildWhatsAppUrl(store.whatsappNumber, "");
    if (href) {
      methods.push({
        kind: "whatsapp",
        label: "WhatsApp",
        value: formatWhatsAppDisplayPhone(store.whatsappNumber, ""),
        href,
      });
    }
  }

  const instagram = normalizeInstagramProfile(store.social.instagram);
  if (instagram) {
    methods.push({
      kind: "instagram",
      label: "Instagram",
      value: instagram.display,
      href: instagram.href,
    });
  }

  return methods;
}
