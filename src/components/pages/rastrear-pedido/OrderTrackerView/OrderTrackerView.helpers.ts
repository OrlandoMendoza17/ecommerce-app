import { z } from "zod";

export const orderTrackerSchema = z.object({
  order_number: z
    .string()
    .min(1, { message: "Ingresa el número de pedido" })
    .max(20)
    .regex(/^\d+$/, { message: "El número de pedido solo debe contener dígitos" }),
  email: z.string().email({ message: "Ingresa un email válido" }),
});

export type OrderTrackerFormValues = z.infer<typeof orderTrackerSchema>;

export const orderTrackerDefaultValues = (prefillOrderNumber?: string): OrderTrackerFormValues => ({
  order_number: prefillOrderNumber ?? "",
  email: "",
});
