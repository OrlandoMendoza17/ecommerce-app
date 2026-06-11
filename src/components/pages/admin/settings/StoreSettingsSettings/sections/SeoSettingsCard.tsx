"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import FormInput from "@/components/form/FormInput/FormInput";
import FormTextarea from "@/components/form/FormTextarea/FormTextarea";
import FormSwitch from "@/components/form/FormSwitch/FormSwitch";
import {
  seoSettingsFormSchema,
  settingsToSeoFormValues,
  type SeoSettingsFormValues,
} from "../StoreSettingsSettings.helpers";
import { useStoreSettingsSectionSave } from "../useStoreSettingsSectionSave";
import SettingsSectionCard from "./SettingsSectionCard";

interface SeoSettingsCardProps {
  settings: StoreSettings;
}

export default function SeoSettingsCard({ settings }: SeoSettingsCardProps) {
  const { save, loading, onValidationError } = useStoreSettingsSectionSave(
    "La configuración SEO se actualizó correctamente"
  );

  const form = useForm<SeoSettingsFormValues>({
    resolver: zodResolver(seoSettingsFormSchema),
    defaultValues: settingsToSeoFormValues(settings),
  });

  const { control, handleSubmit, watch, reset } = form;
  const watchedValues = watch();

  useEffect(() => {
    reset(settingsToSeoFormValues(settings));
  }, [settings, reset]);

  const onSubmit = handleSubmit(
    async (data) => {
      await save({
        id: data.id,
        meta_title: data.meta_title.trim(),
        meta_description: data.meta_description.trim(),
        canonical_base_url: data.canonical_base_url.trim(),
        default_locale: data.default_locale.trim(),
        robots_index: data.robots_index,
      });
    },
    onValidationError
  );

  return (
    <SettingsSectionCard
      id="seo"
      title="SEO global"
      description="Metadatos por defecto del sitio"
      loading={loading}
      onSubmit={onSubmit}
    >
      <Form {...form}>
        <form className="space-y-4">
          <FormInput
            control={control}
            name="meta_title"
            label="Meta título"
            placeholder="Mi Tienda | E-commerce"
            description={`${watchedValues.meta_title?.length ?? 0}/70 caracteres`}
          />

          <FormTextarea
            control={control}
            name="meta_description"
            label="Meta descripción"
            placeholder="Descripción para buscadores y redes sociales"
            rows={3}
            description={`${watchedValues.meta_description?.length ?? 0}/320 caracteres`}
          />

          <FormInput
            control={control}
            name="canonical_base_url"
            label="URL base canónica"
            placeholder="https://mitienda.com"
            description="Sin barra final. Usada para enlaces absolutos y SEO"
          />

          <FormInput
            control={control}
            name="default_locale"
            label="Idioma / locale"
            placeholder="es-VE"
          />

          <FormSwitch
            control={control}
            name="robots_index"
            label="Permitir indexación"
            description="Desactiva en entornos de prueba para evitar que Google indexe el sitio"
          />
        </form>
      </Form>
    </SettingsSectionCard>
  );
}
