import { z } from "zod"
import { vProfile } from "./profile.validations"

const loginFormSchema = () => {
  return z.object({
    email: z.email({ message: 'El email no es válido' }),
    password: z.string({ message: 'La contraseña es obligatoria' }).min(8, { message: 'La contraseña debe tener al menos 8 caracteres' }),
  })
}

const registerFormSchema = () => {
  const profileInsertSchema = vProfile.insert()
  return profileInsertSchema
    .pick({ email: true, full_name: true, phone: true })
    .extend({
      email: z.email({ message: 'El email no es válido' }),
      full_name: z
        .string({ message: 'El nombre es obligatorio' })
        .min(1, { message: 'El nombre es obligatorio' }),
      phone: z
        .string({ message: 'El teléfono es obligatorio' })
        .min(1, { message: 'El teléfono es obligatorio' }),
      password: z
        .string({ message: 'La contraseña es obligatoria' })
        .min(8, { message: 'La contraseña debe tener al menos 8 caracteres' }),
    })
}

const forgotPasswordFormSchema = () => {
  return z.object({
    email: z.string({ message: 'El email es obligatorio' }).email({ message: 'El email no es válido' }),
  })
}

const magicLinkFormSchema = () => {
  return z.object({
    email: z.string({ message: 'El email es obligatorio' }).email({ message: 'El email no es válido' }),
  })
}

const resetPasswordFormSchema = () => {
  return z.object({
    password: z.string({ message: 'La contraseña es obligatoria' }).min(8, { message: 'La contraseña debe tener al menos 8 caracteres' }),
    confirmPassword: z.string({ message: 'La confirmación de contraseña es obligatoria' }),
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ["confirmPassword"],
  })
}

export const vAuth = {
  loginForm: loginFormSchema,
  registerForm: registerFormSchema,
  forgotPasswordForm: forgotPasswordFormSchema,
  magicLinkForm: magicLinkFormSchema,
  resetPasswordForm: resetPasswordFormSchema,
}
