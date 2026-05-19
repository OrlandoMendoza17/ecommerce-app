import { z } from 'zod';
import { vCommon } from './common.validations';

const categoryValidation = () =>
  z.object({
    id: z.uuid(),
    name: z.string().min(1, { message: 'Name is required' }),
    slug: z.string().min(1, { message: 'Slug is required' }),
    description: z.string(),
    image_url: z.string(),
    parent_id: z.uuid().nullable(),
    display_order: z.coerce.number().int(),
    is_active: z.boolean(),
    created_at: z.string().datetime({ message: 'Invalid datetime format' }).optional(),
    updated_at: z.string().datetime({ message: 'Invalid datetime format' }).optional(),
  });

const metadataValidation = () => {
  const categorySchema = categoryValidation();
  return categorySchema.omit({
    created_at: true,
    updated_at: true,
  });
};

const formValidation = () => {
  const categorySchema = categoryValidation();
  return categorySchema.omit({
    id: true,
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

const selectValidation = () =>
  z.object({
    search: z.string().optional(),
    parent_id: z.uuid().optional(),
    is_active: z.boolean().optional(),
  });

const getByIdValidation = () => {
  const schema = categoryValidation();
  return schema.pick({ id: true });
};

const insertValidation = () => {
  const categorySchema = categoryValidation();
  return categorySchema
    .omit({
      id: true,
      created_at: true,
      updated_at: true,
    })
    .extend({
      description: z.string().optional(),
      image_url: z.string().optional(),
      parent_id: z.uuid().nullable().optional(),
      display_order: z.coerce.number().int().optional(),
      is_active: z.boolean().optional(),
    });
};

const updateValidation = () => {
  const categorySchema = categoryValidation();
  const id = categorySchema.shape.id;
  return categoryValidation()
    .omit({
      created_at: true,
      updated_at: true,
    })
    .partial()
    .extend({ id });
};

const deleteValidation = () => {
  const schema = categoryValidation();
  return schema.pick({ id: true });
};

export const vCategory = {
  db: categoryValidation,
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
