"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import FormInput from "@/components/form/FormInput/FormInput";
import {
  settingsToSocialFormValues,
  socialSettingsFormSchema,
  type SocialSettingsFormValues,
} from "../StoreSettingsSettings.helpers";
import { useStoreSettingsSectionSave } from "../useStoreSettingsSectionSave";
import SettingsSectionCard from "./SettingsSectionCard";

interface SocialSettingsCardProps {
  settings: StoreSettings;
}

export default function SocialSettingsCard({ settings }: SocialSettingsCardProps) {
  const { save, loading, onValidationError } = useStoreSettingsSectionSave(
    "Los enlaces de redes sociales se actualizaron correctamente"
  );

  const form = useForm<SocialSettingsFormValues>({
    resolver: zodResolver(socialSettingsFormSchema),
    defaultValues: settingsToSocialFormValues(settings),
  });

  const { control, handleSubmit, reset } = form;

  useEffect(() => {
    reset(settingsToSocialFormValues(settings));
  }, [settings, reset]);

  const onSubmit = handleSubmit(
    async (data) => {
      await save({
        id: data.id,
        social_instagram: data.social_instagram.trim(),
        social_facebook: data.social_facebook.trim(),
        social_tiktok: data.social_tiktok.trim(),
      });
    },
    onValidationError
  );

  return (
    <SettingsSectionCard
      id="redes"
      title="Redes sociales"
      description="Enlaces a perfiles oficiales (deja vacío si no aplica)"
      loading={loading}
      onSubmit={onSubmit}
    >
      <Form {...form}>
        <form className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <FormInput
              control={control}
              name="social_instagram"
              label="Instagram"
              className="text-sm!"
              placeholder="https://instagram.com/mitienda"
            />

            <FormInput
              control={control}
              name="social_facebook"
              label="Facebook"
              className="text-sm!"
              placeholder="https://facebook.com/mitienda"
            />

            <FormInput
              control={control}
              name="social_tiktok"
              label="TikTok"
              className="text-sm!"
              placeholder="https://tiktok.com/@mitienda"
            />
          </div>
        </form>
      </Form>
    </SettingsSectionCard>
  );
}
