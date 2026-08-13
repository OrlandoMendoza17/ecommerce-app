import { z } from 'zod';
import { vCommon, zUuid } from './common.validations';

const brandValidation = () =>
  z.object({
    id: zUuid(),
    name: z.string().min(1, { message: 'El nombre es obligatorio' }),
    image_url: z.url({
      message: 'Formato de URL no válido'
    }).or(z.literal('')),
    display_order: z.coerce.number<number>(),
    is_active: z.boolean(),
    created_at: z.date({ message: 'Formato de fecha y hora no válido' }).optional(),
    updated_at: z.date({ message: 'Formato de fecha y hora no válido' }).optional(),
  });

const metadataValidation = () =>
  brandValidation().omit({
    created_at: true,
    updated_at: true,
  });

const formValidation = () =>
  brandValidation().omit({
    id: true,
    created_at: true,
    updated_at: true,
  });

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
  const schema = brandValidation();
  return z.object({
    search: z.string().optional(),
    is_active: schema.shape.is_active.optional(),
  });
};

const getByIdValidation = () => brandValidation().pick({ id: true });

const insertValidation = () => {
  const schema = brandValidation();
  return schema
    .omit({
      id: true,
      created_at: true,
      updated_at: true,
    })
    .partial({
      image_url: true,
      display_order: true,
      is_active: true,
    });
};

const updateValidation = () => {
  const id = brandValidation().shape.id;
  return brandValidation()
    .omit({
      created_at: true,
      updated_at: true,
    })
    .partial()
    .extend({ id });
};

const deleteValidation = () => brandValidation().pick({ id: true });

export const vBrand = {
  db: brandValidation,
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
