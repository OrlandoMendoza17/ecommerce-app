import { z } from 'zod';
import { vCommon } from './common.validations';

const addressValidation = () =>
  z.object({
    id: z.uuid(),
    profile_id: z.uuid(),
    full_name: z.string().min(1, { message: 'Full name is required' }),
    phone: z.string().min(1, { message: 'Phone is required' }),
    address_line1: z.string().min(1, { message: 'Address line 1 is required' }),
    address_line2: z.string().nullable(),
    city: z.string().min(1, { message: 'City is required' }),
    state: z.string().min(1, { message: 'State is required' }),
    postal_code: z.string().min(1, { message: 'Postal code is required' }),
    country: z.string(),
    is_default: z.boolean(),
    created_at: z.date({ message: 'Invalid datetime format' }).optional(),
    updated_at: z.date({ message: 'Invalid datetime format' }).optional(),
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
