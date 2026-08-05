"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import FormInput from "@/components/form/FormInput/FormInput";
import FormTextarea from "@/components/form/FormTextarea/FormTextarea";
import FormSwitch from "@/components/form/FormSwitch/FormSwitch";
import { Button } from "@/components/ui/button";
import { SEO_TEMPLATE_TOKENS, resolveSeoTemplate } from "@/lib/seo-template";
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

function TokenPickerRow({ onPick }: { onPick: (token: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-gray-500">Insertar:</span>
      {SEO_TEMPLATE_TOKENS.map(({ token, label }) => (
        <Button
          key={token}
          type="button"
          variant="outline"
          size="sm"
          className="h-6 px-2 text-xs font-mono"
          title={label}
          onClick={() => onPick(token)}
        >
          {token}
        </Button>
      ))}
    </div>
  );
}

export default function SeoSettingsCard({ settings }: SeoSettingsCardProps) {
  const { save, loading, onValidationError } = useStoreSettingsSectionSave(
    "La configuración SEO se actualizó correctamente"
  );

  const form = useForm<SeoSettingsFormValues>({
    resolver: zodResolver(seoSettingsFormSchema),
    defaultValues: settingsToSeoFormValues(settings),
  });

  const { control, handleSubmit, watch, reset, setValue, getValues } = form;
  const watchedValues = watch();

  const templateVars = {
    sitename: settings.site_name || "Mi Tienda",
    tagline: settings.site_tagline || "",
  };

  const insertToken = (field: "meta_title" | "meta_description") => (token: string) => {
    const current = getValues(field) ?? "";
    const withSpace = current && !current.endsWith(" ") ? `${current} ` : current;
    setValue(field, `${withSpace}${token}`, { shouldDirty: true });
  };

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
        <form className="space-y-3">
          <div className="space-y-1.5">
            <FormInput
              control={control}
              name="meta_title"
              label="Meta título"
              className="text-sm!"
              placeholder="%{sitename}% | E-commerce"
              description={
                <>
                  {watchedValues.meta_title?.length ?? 0}/70 caracteres
                  {watchedValues.meta_title ? (
                    <>
                      {" · "}Vista previa:{" "}
                      <span className="font-medium text-gray-700">
                        {resolveSeoTemplate(watchedValues.meta_title, templateVars)}
                      </span>
                    </>
                  ) : null}
                </>
              }
            />
            <TokenPickerRow onPick={insertToken("meta_title")} />
          </div>

          <div className="space-y-1.5">
            <FormTextarea
              control={control}
              name="meta_description"
              label="Meta descripción"
              inputClassName="text-sm!"
              placeholder="Descripción para buscadores y redes sociales. Ej: %{tagline}%"
              rows={2}
              description={
                <>
                  {watchedValues.meta_description?.length ?? 0}/320 caracteres
                  {watchedValues.meta_description ? (
                    <>
                      {" · "}Vista previa:{" "}
                      <span className="font-medium text-gray-700">
                        {resolveSeoTemplate(watchedValues.meta_description, templateVars)}
                      </span>
                    </>
                  ) : null}
                </>
              }
            />
            <TokenPickerRow onPick={insertToken("meta_description")} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 items-start">
            <FormInput
              control={control}
              name="canonical_base_url"
              label="URL base canónica"
              className="text-sm!"
              placeholder="https://mitienda.com"
              description="Sin barra final. Usada para enlaces absolutos y SEO"
            />

            <FormInput
              control={control}
              name="default_locale"
              label="Idioma / locale"
              className="text-sm!"
              placeholder="es-VE"
            />
          </div>

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
