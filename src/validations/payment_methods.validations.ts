import { z } from 'zod';
import { PAYMENT_METHOD_TYPES } from '@/constants/payment-methods';
import { zUuid } from './common.validations';

const paymentMethodTypeEnum = z.enum(PAYMENT_METHOD_TYPES, {
  message: 'Tipo de método de pago no válido',
});

const paymentMethodValidation = () =>
  z.object({
    id: zUuid(),
    name: z.string().min(1, { message: 'El nombre es obligatorio' }).max(255, {
      message: 'El nombre no puede superar los 255 caracteres',
    }),
    type: paymentMethodTypeEnum,
    payment_details: z.record(z.string(), z.string()),
    is_active: z.boolean(),
    created_at: z.date({ message: 'Formato de fecha y hora no válido' }).optional(),
    updated_at: z.date({ message: 'Formato de fecha y hora no válido' }).optional(),
    deleted_at: z.date({ message: 'Formato de fecha y hora no válido' }).nullable().optional(),
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
