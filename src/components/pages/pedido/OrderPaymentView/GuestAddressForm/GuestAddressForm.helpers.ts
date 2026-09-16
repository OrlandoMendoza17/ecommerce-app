import { z } from "zod";

export const GUEST_ADDRESS_FORM_ID = "guest-address-form";

export const guestAddressSchema = z.object({
  full_name: z.string().min(1, { message: "El nombre es obligatorio" }),
  phone: z.string().min(1, { message: "El teléfono es obligatorio" }),
  address_line1: z.string().min(1, { message: "La dirección es obligatoria" }),
  address_line2: z.string().optional(),
  city: z.string().min(1, { message: "La ciudad es obligatoria" }),
  state: z.string().min(1, { message: "El estado es obligatorio" }),
  postal_code: z.string().optional(),
  country: z.string().optional(),
});

export type GuestAddressFormValues = z.infer<typeof guestAddressSchema>;

export interface GuestShippingPrefill {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export const guestAddressDefaultValues: GuestAddressFormValues = {
  full_name: "",
  phone: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "Venezuela",
};

export function prefillToFormValues(
  prefill: GuestShippingPrefill
): GuestAddressFormValues {
  return {
    full_name: prefill.full_name,
    phone: prefill.phone,
    address_line1: prefill.address_line1,
    address_line2: prefill.address_line2,
    city: prefill.city,
    state: prefill.state,
    postal_code: prefill.postal_code,
    country: prefill.country || "Venezuela",
  };
}

export function formatGuestAddressLabel(prefill: GuestShippingPrefill): string {
  const parts = [
    prefill.address_line1,
    prefill.address_line2,
    [prefill.city, prefill.state].filter(Boolean).join(", "),
  ].filter(Boolean);
  return parts.join(" · ");
}
