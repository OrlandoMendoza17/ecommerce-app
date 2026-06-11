import { z } from "zod";
import { vStoreSettings } from "@/validations/store_settings.validations";

export const STORE_ASSETS_BUCKET = "store_assets";

export const STORE_ASSETS_FOLDERS = {
  logo: "logo",
  favicon: "favicon",
  og: "og",
} as const;

export const brandSettingsFormSchema = vStoreSettings.brandForm();
export const seoSettingsFormSchema = vStoreSettings.seoForm();
export const contactSettingsFormSchema = vStoreSettings.contactForm();
export const socialSettingsFormSchema = vStoreSettings.socialForm();

export type BrandSettingsFormValues = z.input<typeof brandSettingsFormSchema>;
export type SeoSettingsFormValues = z.infer<typeof seoSettingsFormSchema>;
export type ContactSettingsFormValues = z.infer<typeof contactSettingsFormSchema>;
export type SocialSettingsFormValues = z.infer<typeof socialSettingsFormSchema>;

export function settingsToBrandFormValues(
  settings: StoreSettings
): BrandSettingsFormValues {
  return {
    id: settings.id,
    site_name: settings.site_name,
    site_tagline: settings.site_tagline,
    logo_files: settings.logo_url ? [settings.logo_url] : [],
    favicon_files: settings.favicon_url ? [settings.favicon_url] : [],
    og_image_files: settings.og_image_url ? [settings.og_image_url] : [],
  };
}

export function settingsToSeoFormValues(settings: StoreSettings): SeoSettingsFormValues {
  return {
    id: settings.id,
    meta_title: settings.meta_title,
    meta_description: settings.meta_description,
    canonical_base_url: settings.canonical_base_url,
    default_locale: settings.default_locale,
    robots_index: settings.robots_index,
  };
}

export function settingsToContactFormValues(
  settings: StoreSettings
): ContactSettingsFormValues {
  return {
    id: settings.id,
    support_email: settings.support_email,
    support_phone: settings.support_phone,
    whatsapp_number: settings.whatsapp_number,
    footer_text: settings.footer_text,
  };
}

export function settingsToSocialFormValues(
  settings: StoreSettings
): SocialSettingsFormValues {
  return {
    id: settings.id,
    social_instagram: settings.social_instagram,
    social_facebook: settings.social_facebook,
    social_tiktok: settings.social_tiktok,
  };
}

export async function resolveAssetUrl(
  files: (string | File)[],
  folder: string,
  uploadFiles: (params: {
    files: File[];
    folder: string;
    bucket: string;
  }) => Promise<string[]>
): Promise<string> {
  const existingUrls = files.filter((item): item is string => typeof item === "string");
  const newFiles = files.filter((item): item is File => item instanceof File);

  if (newFiles.length > 0) {
    const uploadedUrls = await uploadFiles({
      files: newFiles,
      folder,
      bucket: STORE_ASSETS_BUCKET,
    });
    if (uploadedUrls.length > 0) return uploadedUrls[0];
  }

  return existingUrls[0] ?? "";
}
