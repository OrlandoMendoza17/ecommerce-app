import { z } from 'zod';
import { PAYMENT_METHOD_TYPES } from '@/constants/payment-methods';

const paymentMethodTypeEnum = z.enum(PAYMENT_METHOD_TYPES);

const paymentMethodValidation = () =>
  z.object({
    id: z.uuid(),
    name: z.string().min(1, { message: 'Name is required' }).max(255, {
      message: 'Name must be 255 characters or less',
    }),
    type: paymentMethodTypeEnum,
    payment_details: z.record(z.string(), z.string()),
    is_active: z.boolean(),
    created_at: z.date({ message: 'Invalid datetime format' }).optional(),
    updated_at: z.date({ message: 'Invalid datetime format' }).optional(),
    deleted_at: z.date({ message: 'Invalid datetime format' }).nullable().optional(),
  });

const metadataValidation = () => {
  const schema = paymentMethodValidation();
  return schema.omit({
    created_at: true,
    updated_at: true,
    deleted_at: true,
  });
};

const selectValidation = () => {
  const schema = paymentMethodValidation();
  return z.object({
    is_active: schema.shape.is_active.optional(),
  });
};

const getByIdValidation = () => {
  const schema = paymentMethodValidation();
  return schema.pick({ id: true });
};

const insertValidation = () => {
  const schema = paymentMethodValidation();
  return schema.omit({
    id: true,
    created_at: true,
    updated_at: true,
    deleted_at: true,
  })
};

const updateValidation = () => {
  const schema = paymentMethodValidation();
  const id = schema.shape.id;
  return paymentMethodValidation()
    .omit({
      created_at: true,
      updated_at: true,
      deleted_at: true,
    })
    .partial()
    .extend({ id });
};

const deleteValidation = () => {
  const schema = paymentMethodValidation();
  return schema.pick({ id: true });
};

export const vPaymentMethod = {
  db: paymentMethodValidation,
  metadata: metadataValidation,
  select: selectValidation,
  getById: getByIdValidation,
  insert: insertValidation,
  update: updateValidation,
  delete: deleteValidation,
};
