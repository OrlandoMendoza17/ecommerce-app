import { z } from 'zod';
import { zUuid } from './common.validations';

const optionalUrl = () =>
  z
    .string()
    .trim()
    .refine(
      (value) => value === '' || z.url().safeParse(value).success,
      { message: 'URL no válida' }
    );

const optionalEmail = () =>
  z
    .string()
    .trim()
    .refine(
      (value) => value === '' || z.email().safeParse(value).success,
      { message: 'Correo electrónico no válido' }
    );

const storeSettingsValidation = () =>
  z.object({
    id: zUuid(),
    singleton: z.boolean(),
    site_name: z.string().trim().min(1, { message: 'El nombre de la tienda es obligatorio' }).max(255),
    site_tagline: z.string().trim().max(500),
    logo_url: z.string().trim(),
    favicon_url: z.string().trim(),
    og_image_url: z.string().trim(),
    meta_title: z.string().trim().max(70),
    meta_description: z.string().trim().max(320),
    canonical_base_url: z
      .string()
      .trim()
      .refine(
        (value) =>
          value === '' ||
          (z.url().safeParse(value).success && !value.endsWith('/')),
        { message: 'URL base inválida (sin barra final)' }
      ),
    default_locale: z.string().trim().min(2).max(10),
    robots_index: z.boolean(),
    currency: z.enum(['USD', 'EUR'], { message: 'Moneda no válida' }),
    support_email: optionalEmail(),
    support_phone: z.string().trim().max(50),
    whatsapp_number: z
      .string()
      .trim()
      .refine(
        (value) => value === '' || /^\d{10,15}$/.test(value.replace(/\D/g, '')),
        { message: 'Número de WhatsApp no válido' }
      ),
    footer_text: z.string().trim().max(500),
    social_instagram: optionalUrl(),
    social_facebook: optionalUrl(),
    social_tiktok: optionalUrl(),
    created_at: z.date({ message: 'Formato de fecha y hora no válido' }).optional(),
    updated_at: z.date({ message: 'Formato de fecha y hora no válido' }).optional(),
  });

const fileFieldValidation = () =>
  z.array(z.union([z.string(), z.instanceof(File)]));

const withSettingsId = <T extends z.ZodRawShape>(shape: T) =>
  z.object({ id: zUuid(), ...shape });

const brandFormValidation = () =>
  withSettingsId({
    site_name: z
      .string()
      .trim()
      .min(1, { message: 'El nombre de la tienda es obligatorio' })
      .max(255),
    site_tagline: z.string().trim().max(500),
    logo_files: fileFieldValidation(),
    favicon_files: fileFieldValidation(),
    og_image_files: fileFieldValidation(),
  });

const seoFormValidation = () =>
  withSettingsId({
    meta_title: z.string().trim().max(70),
    meta_description: z.string().trim().max(320),
    canonical_base_url: z
      .string()
      .trim()
      .refine(
        (value) =>
          value === '' ||
          (z.url().safeParse(value).success && !value.endsWith('/')),
        { message: 'URL base inválida (sin barra final)' }
      ),
    default_locale: z.string().trim().min(2).max(10),
    robots_index: z.boolean(),
  });

const contactFormValidation = () =>
  withSettingsId({
    support_email: optionalEmail(),
    support_phone: z.string().trim().max(50),
    whatsapp_number: z
      .string()
      .trim()
      .refine(
        (value) => value === '' || /^\d{10,15}$/.test(value.replace(/\D/g, '')),
        { message: 'Número de WhatsApp no válido' }
      ),
    footer_text: z.string().trim().max(500),
  });

const socialFormValidation = () =>
  withSettingsId({
    social_instagram: optionalUrl(),
    social_facebook: optionalUrl(),
    social_tiktok: optionalUrl(),
  });

const updateValidation = () => {
  const schema = storeSettingsValidation();
  const id = schema.shape.id;
  return storeSettingsValidation()
    .omit({
      singleton: true,
      created_at: true,
      updated_at: true,
    })
    .partial()
    .extend({ id });
};

export const vStoreSettings = {
  db: storeSettingsValidation,
  brandForm: brandFormValidation,
  seoForm: seoFormValidation,
  contactForm: contactFormValidation,
  socialForm: socialFormValidation,
  update: updateValidation,
};
