import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { STORE_SETTINGS_FALLBACK } from "@/lib/store-settings";

export type StoreSeoSettings = {
  siteName: string;
  siteTagline: string;
  metaTitle: string;
  metaDescription: string;
  canonicalBaseUrl: string;
  defaultLocale: string;
  robotsIndex: boolean;
  ogImageUrl: string;
  faviconUrl: string;
};

const SEO_COLUMNS =
  "site_name,site_tagline,meta_title,meta_description,canonical_base_url,default_locale,robots_index,og_image_url,favicon_url";

const FALLBACK: StoreSeoSettings = {
  siteName: STORE_SETTINGS_FALLBACK.site_name,
  siteTagline: STORE_SETTINGS_FALLBACK.site_tagline,
  metaTitle: "",
  metaDescription: "",
  canonicalBaseUrl: "",
  defaultLocale: "es-VE",
  robotsIndex: true,
  ogImageUrl: "",
  faviconUrl: "",
};

/**
 * Fetch without cookies so it can live inside unstable_cache.
 * store_settings is public (anon can read it).
 */
async function _fetchStoreSeoSettings(): Promise<StoreSeoSettings> {
  try {
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data } = await supabase
      .from("store_settings")
      .select(SEO_COLUMNS)
      .limit(1)
      .maybeSingle();

    return {
      siteName: data?.site_name?.trim() || STORE_SETTINGS_FALLBACK.site_name,
      siteTagline:
        data?.site_tagline?.trim() || STORE_SETTINGS_FALLBACK.site_tagline,
      metaTitle: (data as any)?.meta_title?.trim() || "",
      metaDescription: (data as any)?.meta_description?.trim() || "",
      canonicalBaseUrl: (data as any)?.canonical_base_url?.trim() || "",
      defaultLocale: (data as any)?.default_locale?.trim() || "es-VE",
      robotsIndex: (data as any)?.robots_index ?? true,
      ogImageUrl: (data as any)?.og_image_url?.trim() || "",
      faviconUrl: (data as any)?.favicon_url?.trim() || "",
    };
  } catch {
    return FALLBACK;
  }
}

/**
 * Cached with Next.js data cache (10 min, tag "store-settings").
 * Call revalidateTag("store-settings") when store settings are updated.
 */
const _getCachedStoreSeoSettings = unstable_cache(
  _fetchStoreSeoSettings,
  ["store-seo-settings"],
  { tags: ["store-settings"], revalidate: 600 }
);

/**
 * Per-request deduplicated (React.cache) + Next.js cached (unstable_cache).
 * Safe to call in layouts, generateMetadata, and page components.
 */
export const getStoreSeoSettings = cache(_getCachedStoreSeoSettings);

/** @deprecated Use getStoreSeoSettings() instead. */
export async function getPublicStoreSiteName(): Promise<string> {
  const s = await getStoreSeoSettings();
  return s.siteName;
}
