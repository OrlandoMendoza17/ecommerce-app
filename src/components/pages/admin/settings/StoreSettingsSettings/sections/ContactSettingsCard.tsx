"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import FormInput from "@/components/form/FormInput/FormInput";
import FormTextarea from "@/components/form/FormTextarea/FormTextarea";
import {
  contactSettingsFormSchema,
  settingsToContactFormValues,
  type ContactSettingsFormValues,
} from "../StoreSettingsSettings.helpers";
import { useStoreSettingsSectionSave } from "../useStoreSettingsSectionSave";
import SettingsSectionCard from "./SettingsSectionCard";

interface ContactSettingsCardProps {
  settings: StoreSettings;
}

export default function ContactSettingsCard({ settings }: ContactSettingsCardProps) {
  const { save, loading, onValidationError } = useStoreSettingsSectionSave(
    "Los datos de contacto se actualizaron correctamente"
  );

  const form = useForm<ContactSettingsFormValues>({
    resolver: zodResolver(contactSettingsFormSchema),
    defaultValues: settingsToContactFormValues(settings),
  });

  const { control, handleSubmit, reset } = form;

  useEffect(() => {
    reset(settingsToContactFormValues(settings));
  }, [settings, reset]);

  const onSubmit = handleSubmit(
    async (data) => {
      await save({
        id: data.id,
        support_email: data.support_email.trim(),
        support_phone: data.support_phone.trim(),
        whatsapp_number: data.whatsapp_number.replace(/\D/g, ""),
        footer_text: data.footer_text.trim(),
      });
    },
    onValidationError
  );

  return (
    <SettingsSectionCard
      id="contacto"
      title="Contacto"
      description="Datos visibles en footer y flujos de pedido"
      loading={loading}
      onSubmit={onSubmit}
    >
      <Form {...form}>
        <form className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormInput
              control={control}
              name="support_email"
              label="Correo de soporte"
              type="email"
              className="text-sm!"
              placeholder="contacto@mitienda.com"
            />

            <FormInput
              control={control}
              name="support_phone"
              label="Teléfono"
              className="text-sm!"
              placeholder="+58 412-1234567"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormInput
              control={control}
              name="whatsapp_number"
              label="WhatsApp"
              className="text-sm!"
              placeholder="584121234567"
              description="Solo dígitos, con código de país"
            />

            <FormTextarea
              control={control}
              name="footer_text"
              label="Texto del footer"
              inputClassName="text-sm!"
              placeholder="© 2026 Mi Tienda. Todos los derechos reservados."
              rows={2}
            />
          </div>
        </form>
      </Form>
    </SettingsSectionCard>
  );
}
