import { z } from 'zod';
import { vCommon, zUuid } from './common.validations';

const addressValidation = () =>
  z.object({
    id: zUuid(),
    profile_id: zUuid(),
    full_name: z.string().min(1, { message: 'El nombre completo es obligatorio' }),
    phone: z.string().min(1, { message: 'El teléfono es obligatorio' }),
    address_line1: z.string().min(1, { message: 'La dirección línea 1 es obligatoria' }),
    address_line2: z.string().nullable(),
    city: z.string().min(1, { message: 'La ciudad es obligatoria' }),
    state: z.string().min(1, { message: 'El estado o provincia es obligatorio' }),
    postal_code: z.string().min(1, { message: 'El código postal es obligatorio' }),
    country: z.string(),
    is_default: z.boolean(),
    created_at: z.date({ message: 'Formato de fecha y hora no válido' }).optional(),
    updated_at: z.date({ message: 'Formato de fecha y hora no válido' }).optional(),
  });

const metadataValidation = () => {
  const schema = addressValidation();
  return schema.omit({
    created_at: true,
    updated_at: true,
  });
};

const formValidation = () => {
  const schema = addressValidation();
  return schema.omit({
    id: true,
    profile_id: true,
    created_at: true,
    updated_at: true,
  });
};

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

const selectValidation = () => {
  const schema = addressValidation();
  const is_default = schema.shape.is_default.optional();
  return z.object({
    search: z.string().optional(),
    is_default,
  });
};

const getByIdValidation = () => {
  const schema = addressValidation();
  return schema.pick({ id: true });
};

const insertValidation = () => {
  const schema = addressValidation();
  const address_line2 = schema.shape.address_line2.optional();
  const country = schema.shape.country.optional();
  const is_default = schema.shape.is_default.optional();
  return schema
    .omit({
      id: true,
      profile_id: true,
      created_at: true,
      updated_at: true,
    })
    .extend({
      address_line2,
      country,
      is_default,
    });
};

const updateValidation = () => {
  const schema = addressValidation();
  const id = schema.shape.id;
  return addressValidation()
    .omit({
      profile_id: true,
      created_at: true,
      updated_at: true,
    })
    .partial()
    .extend({ id });
};

const deleteValidation = () => {
  const schema = addressValidation();
  return schema.pick({ id: true });
};

export const vAddress = {
  db: addressValidation,
  metadata: metadataValidation,
  form: formValidation,
  count: countValidation,
  selectByRange: selectByRangeValidation,
  select: selectValidation,
  getById: getByIdValidation,
  insert: insertValidation,
  update: updateValidation,
  delete: deleteValidation,
};
