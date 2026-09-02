import { z } from "zod";

export const guestContactSchema = z.object({
  full_name: z
    .string()
    .min(2, { message: "El nombre debe tener al menos 2 caracteres" })
    .max(100),
  email: z.string().email({ message: "Ingresa un email válido" }),
  phone: z
    .string()
    .max(30)
    .optional()
    .or(z.literal("")),
});

export type GuestContactFormValues = z.infer<typeof guestContactSchema>;

export const guestContactDefaultValues: GuestContactFormValues = {
  full_name: "",
  email: "",
  phone: "",
};
