import { z } from 'zod';
import { vCommon, zUuid } from './common.validations';

const ORDER_STATUSES = [
  'pending_payment',
  'payment_submitted',
  'payment_confirmed',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
] as const;

const PAYMENT_STATUSES = ['pending', 'submitted', 'confirmed', 'failed'] as const;

const FULFILLMENT_STATUSES = ['shipped', 'delivered'] as const;

const orderValidation = () =>
  z.object({
    id: zUuid(),
    profile_id: zUuid(),
    order_number: z.string(),
    status: z.enum(ORDER_STATUSES),
    payment_status: z.enum(PAYMENT_STATUSES),
    subtotal: z.coerce.number<number>().min(0),
    tax: z.coerce.number<number>().min(0),
    shipping_cost: z.coerce.number<number>().min(0),
    discount: z.coerce.number<number>().min(0),
    total: z.coerce.number<number>().min(0),
    shipping_full_name: z.string(),
    shipping_phone: z.string(),
    created_at: z.string(),
    updated_at: z.string().optional(),
  });

const orderIdValidation = () => orderValidation().pick({ id: true });

const countValidation = () =>
  z.object({
    filters: vCommon.filters(),
    q: z.string().optional(),
  });

const selectByRangeValidation = () => {
  const extras = z.object({
    filters: vCommon.filters(),
    q: z.string().optional(),
  });
  return vCommon.selectByRange(extras);
};

const submitPaymentValidation = () =>
  z.object({
    id: zUuid(),
    payment_method_id: zUuid(),
    payment_reference: z
      .string()
      .min(1, { message: "El código de referencia es obligatorio" })
      .max(255),
    payment_date: z
      .string()
      .min(1, { message: "La fecha del pago es obligatoria" })
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Fecha no válida" }),
    issuer_bank: z.string().max(120).optional().or(z.literal("")),
    payment_proof_url: z.string().url().optional().or(z.literal("")),
  });

const createFromCartValidation = () =>
  z.object({
    guest_email: z.string().email().optional(),
  });

const DELIVERY_MODES = ['address', 'coordinate'] as const;

const setShippingValidation = () =>
  z.discriminatedUnion('mode', [
    z.object({
      id: zUuid(),
      mode: z.literal('address'),
      address_id: zUuid(),
      guest_access_token: z.string().uuid().optional(),
    }),
    z.object({
      id: zUuid(),
      mode: z.literal('coordinate'),
      guest_access_token: z.string().uuid().optional(),
    }),
  ]);

const updateFulfillmentValidation = () =>
  z.object({
    id: zUuid(),
    status: z.enum(FULFILLMENT_STATUSES),
    tracking_number: z.string().max(120).optional(),
  });

const trackByNumberValidation = () =>
  z.object({
    order_number: z
      .string()
      .min(1, { message: "Ingresa el número de pedido" })
      .max(20)
      .regex(/^\d+$/, { message: "El número de pedido solo debe contener dígitos" }),
    email: z.string().email({ message: "Ingresa un email válido" }),
  });

const createGuestOrderValidation = () =>
  z.object({
    guest_name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }).max(100),
    guest_email: z.string().email({ message: "Ingresa un email válido" }),
    guest_phone: z.string().max(30).optional().or(z.literal("")),
    items: z
      .array(
        z.object({
          product_id: z.string().uuid(),
          variant_id: z.string().uuid(),
          quantity: z.number().int().min(1).max(50),
          customization_text: z.string().max(500).optional().or(z.literal("")),
          customization_notes: z.string().max(500).optional().or(z.literal("")),
        })
      )
      .min(1, { message: "Debes enviar al menos un producto" })
      .max(50),
  });

const getByIdWithTokenValidation = () =>
  z.object({
    id: zUuid(),
    guest_access_token: z.string().uuid().optional(),
  });

const submitPaymentWithTokenValidation = () =>
  z.object({
    id: zUuid(),
    guest_access_token: z.string().uuid().optional(),
    payment_method_id: zUuid(),
    payment_reference: z
      .string()
      .min(1, { message: "El código de referencia es obligatorio" })
      .max(255),
    payment_date: z
      .string()
      .min(1, { message: "La fecha del pago es obligatoria" })
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Fecha no válida" }),
    issuer_bank: z.string().max(120).optional().or(z.literal("")),
    payment_proof_url: z.string().url().optional().or(z.literal("")),
  });

export const vOrder = {
  db: orderValidation,
  getById: getByIdWithTokenValidation,
  getByIdAdmin: orderIdValidation,
  createFromCart: createFromCartValidation,
  createGuestOrder: createGuestOrderValidation,
  setShipping: setShippingValidation,
  submitPayment: submitPaymentWithTokenValidation,
  confirmPayment: orderIdValidation,
  cancelOrder: orderIdValidation,
  updateFulfillment: updateFulfillmentValidation,
  count: countValidation,
  selectByRange: selectByRangeValidation,
  trackByNumber: trackByNumberValidation,
};
