"use client";

import { useEffect } from "react";
import Image from "next/image";
import { Store } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import FormInput from "@/components/form/FormInput/FormInput";
import FormFileInput from "@/components/form/FormFileInput/FormFileInput";
import { uploadFiles } from "@/utils/supabase/storage/uploadFiles";
import {
  STORE_ASSETS_BUCKET,
  STORE_ASSETS_FOLDERS,
  brandSettingsFormSchema,
  resolveAssetUrl,
  settingsToBrandFormValues,
  type BrandSettingsFormValues,
} from "../StoreSettingsSettings.helpers";
import { useStoreSettingsSectionSave } from "../useStoreSettingsSectionSave";
import SettingsSectionCard from "./SettingsSectionCard";

interface BrandSettingsCardProps {
  settings: StoreSettings;
}

export default function BrandSettingsCard({ settings }: BrandSettingsCardProps) {
  const { save, loading, onValidationError } = useStoreSettingsSectionSave(
    "La marca e identidad de la tienda se actualizaron correctamente"
  );

  const form = useForm<BrandSettingsFormValues>({
    resolver: zodResolver(brandSettingsFormSchema),
    defaultValues: settingsToBrandFormValues(settings),
  });

  const { control, handleSubmit, watch, reset, setValue } = form;
  const watchedValues = watch();

  useEffect(() => {
    reset(settingsToBrandFormValues(settings));
  }, [settings, reset]);

  const logoPreview =
    watchedValues.logo_files?.find((item) => typeof item === "string") ??
    (watchedValues.logo_files?.[0] instanceof File
      ? URL.createObjectURL(watchedValues.logo_files[0])
      : null);

  const onSubmit = handleSubmit(
    async (data) => {
      try {
        const [logo_url, favicon_url, og_image_url] = await Promise.all([
          resolveAssetUrl(data.logo_files ?? [], STORE_ASSETS_FOLDERS.logo, uploadFiles),
          resolveAssetUrl(data.favicon_files ?? [], STORE_ASSETS_FOLDERS.favicon, uploadFiles),
          resolveAssetUrl(data.og_image_files ?? [], STORE_ASSETS_FOLDERS.og, uploadFiles),
        ]);

        await save({
          id: data.id,
          site_name: data.site_name.trim(),
          site_tagline: data.site_tagline.trim(),
          logo_url,
          favicon_url,
          og_image_url,
        });
      } catch (error) {
        console.error("Error saving brand settings:", error);
      }
    },
    onValidationError
  );

  return (
    <SettingsSectionCard
      id="marca"
      title="Marca e identidad"
      description="Nombre, eslogan e imágenes de la tienda"
      loading={loading}
      submitDisabled={!watchedValues.site_name?.trim()}
      onSubmit={onSubmit}
    >
      <Form {...form}>
        <form className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormInput
              control={control}
              name="site_name"
              label="Nombre de la tienda"
              className="text-sm!"
              placeholder="Mi Tienda"
            />

            <FormInput
              control={control}
              name="site_tagline"
              label="Eslogan"
              className="text-sm!"
              placeholder="Envíos a todo el país · Pagos flexibles"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <FormFileInput
              name="logo_files"
              label="Logo"
              description="PNG, SVG, JPG o WEBP. Máx. 2 MB"
              folder={STORE_ASSETS_FOLDERS.logo}
              bucket={STORE_ASSETS_BUCKET}
              multiple={false}
              maxFiles={1}
              maxSize={2 * 1024 * 1024}
              accept={{
                "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp", ".svg"],
              }}
              handleDrop={(acceptedFiles) => {
                if (acceptedFiles.length > 0) {
                  setValue("logo_files", [acceptedFiles[0]]);
                }
              }}
            />

            <FormFileInput
              name="favicon_files"
              label="Favicon"
              description="ICO o PNG. Máx. 512 KB"
              folder={STORE_ASSETS_FOLDERS.favicon}
              bucket={STORE_ASSETS_BUCKET}
              multiple={false}
              maxFiles={1}
              maxSize={512 * 1024}
              accept={{
                "image/*": [".ico", ".png", ".jpg", ".jpeg"],
              }}
              handleDrop={(acceptedFiles) => {
                if (acceptedFiles.length > 0) {
                  setValue("favicon_files", [acceptedFiles[0]]);
                }
              }}
            />

            <FormFileInput
              name="og_image_files"
              label="Imagen Open Graph"
              description="1200×630 recomendado. Máx. 2 MB"
              folder={STORE_ASSETS_FOLDERS.og}
              bucket={STORE_ASSETS_BUCKET}
              multiple={false}
              maxFiles={1}
              maxSize={2 * 1024 * 1024}
              accept={{
                "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
              }}
              handleDrop={(acceptedFiles) => {
                if (acceptedFiles.length > 0) {
                  setValue("og_image_files", [acceptedFiles[0]]);
                }
              }}
            />
          </div>
        </form>
      </Form>
    </SettingsSectionCard>
  );
}
