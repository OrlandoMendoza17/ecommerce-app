import { z } from 'zod';
import { vCommon, zUuid } from './common.validations';

const categoryValidation = () =>
  z.object({
    id: zUuid(),
    name: z.string().min(1, { message: 'El nombre es obligatorio' }),
    slug: z.string().min(1, { message: 'El slug es obligatorio' }),
    description: z.string(),
    image_url: z.url({
      message: 'Formato de URL no válido'
    }).or(z.literal('')),
    parent_id: zUuid().nullable(),
    display_order: z.coerce.number<number>().int(),
    is_active: z.boolean(),
    created_at: z.date({ message: 'Formato de fecha y hora no válido' }).optional(),
    updated_at: z.date({ message: 'Formato de fecha y hora no válido' }).optional(),
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
  const formSchema = categorySchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
  });
  return formSchema;
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
  const schema = categoryValidation();
  const parent_id = schema.shape.parent_id.optional();
  const is_active = schema.shape.is_active.optional();
  return z.object({
    search: z.string().optional(),
    parent_id,
    is_active,
  });
};

const getByIdValidation = () => {
  const schema = categoryValidation();
  return schema.pick({ id: true });
};

const insertValidation = () => {
  const categorySchema = categoryValidation();
  const description = categorySchema.shape.description.optional();
  const image_url = categorySchema.shape.image_url.optional();
  const parent_id = categorySchema.shape.parent_id.optional();
  const display_order = categorySchema.shape.display_order.optional();
  const is_active = categorySchema.shape.is_active.optional();
  return categorySchema
    .omit({
      id: true,
      created_at: true,
      updated_at: true,
    })
    .extend({
      description,
      image_url,
      parent_id,
      display_order,
      is_active,
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
