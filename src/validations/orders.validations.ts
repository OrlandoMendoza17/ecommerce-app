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

const updateFulfillmentValidation = () =>
  z.object({
    id: zUuid(),
    status: z.enum(FULFILLMENT_STATUSES),
    tracking_number: z.string().max(120).optional(),
  });

export const vOrder = {
  db: orderValidation,
  getById: orderIdValidation,
  getByIdAdmin: orderIdValidation,
  createFromCart: () => z.object({}).optional(),
  submitPayment: submitPaymentValidation,
  confirmPayment: orderIdValidation,
  cancelOrder: orderIdValidation,
  updateFulfillment: updateFulfillmentValidation,
  count: countValidation,
  selectByRange: selectByRangeValidation,
};
