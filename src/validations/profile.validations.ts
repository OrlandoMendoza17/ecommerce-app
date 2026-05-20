import { z } from 'zod';
import { vCommon } from './common.validations';

const profileValidation = () =>
  z.object({
    id: z.uuid(),
    email: z.email({ message: 'Invalid email format' }),
    full_name: z.string(),
    phone: z.string(),
    avatar_url: z.string(),
    date_of_birth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be in YYYY-MM-DD format' })
      .nullable(),
    is_admin: z.boolean(),
    created_at: z.date({ message: 'Invalid datetime format' }).optional(),
    updated_at: z.date({ message: 'Invalid datetime format' }).optional(),
    deleted_at: z.date({ message: 'Invalid datetime format' }).nullable().optional(),
  });

const metadataValidation = () => {
  const profileSchema = profileValidation();
  return profileSchema.omit({
    created_at: true,
    updated_at: true,
    deleted_at: true,
  });
};

const formValidation = () => {
  const profileSchema = profileValidation();
  return profileSchema.omit({
    id: true,
    email: true,
    is_admin: true,
    created_at: true,
    updated_at: true,
    deleted_at: true,
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

const selectValidation = () =>
  z.object({
    search: z.string().optional(),
  });

const getByIdValidation = () => {
  const schema = profileValidation();
  return schema.pick({ id: true });
};

const insertValidation = () => {
  const profileSchema = profileValidation();
  const full_name = profileSchema.shape.full_name.optional();
  const phone = profileSchema.shape.phone.optional();
  const avatar_url = profileSchema.shape.avatar_url.optional();
  const date_of_birth = profileSchema.shape.date_of_birth.optional();
  return profileSchema
    .omit({
      is_admin: true,
      created_at: true,
      updated_at: true,
      deleted_at: true,
    })
    .extend({
      full_name,
      phone,
      avatar_url,
      date_of_birth,
    });
};

const updateValidation = () => {
  const profileSchema = profileValidation();
  const id = profileSchema.shape.id;
  return profileValidation()
    .omit({
      is_admin: true,
      created_at: true,
      updated_at: true,
      deleted_at: true,
    })
    .partial()
    .extend({ id });
};

const deleteValidation = () => {
  const schema = profileValidation();
  return schema.pick({ id: true });
};

export const vProfile = {
  db: profileValidation,
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
