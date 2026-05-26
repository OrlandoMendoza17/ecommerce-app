import { z } from 'zod';
import { vCommon, zUuid } from './common.validations';

const productValidation = () =>
  z.object({
    id: zUuid(),
    category_id: zUuid().nullable(),
    name: z.string().min(1, { message: 'El nombre es obligatorio' }),
    slug: z.string().min(1, { message: 'El slug es obligatorio' }),
    description: z.string(),
    price: z.coerce.number<number>().min(0, { message: 'El precio debe ser al menos 0' }),
    compare_at_price: z.coerce.number<number>().min(0, { message: 'El precio comparativo debe ser al menos 0' }),
    cost: z.coerce.number<number>().min(0, { message: 'El costo debe ser al menos 0' }),
    sku: z.string(),
    stock_quantity: z.coerce.number<number>().min(0, { message: 'La cantidad en stock debe ser al menos 0' }),
    low_stock_threshold: z.coerce.number<number>().min(0, { message: 'El umbral de stock bajo debe ser al menos 0' }),
    allow_backorder: z.boolean(),
    images: z.array(z.string()).default([]),
    meta_title: z.string(),
    meta_description: z.string(),
    is_active: z.boolean(),
    is_featured: z.boolean(),
    created_at: z.date({ message: 'Formato de fecha y hora no válido' }).optional(),
    updated_at: z.date({ message: 'Formato de fecha y hora no válido' }).optional(),
  });

const metadataValidation = () => {
  const schema = productValidation();
  return schema.omit({
    created_at: true,
    updated_at: true,
  });
};

const formValidation = () => {
  const productSchema = productValidation();
  const formSchema = productSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
  });
  return formSchema;
};

const uiFormValidation = () => {
  const productSchema = productValidation();
  return productSchema
    .omit({
      id: true,
      created_at: true,
      updated_at: true,
      images: true,
    })
    .extend({
      image_files: z.array(z.instanceof(File)).optional(),
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
  const schema = productValidation();
  const category_id = schema.shape.category_id.optional();
  const is_active = schema.shape.is_active.optional();
  const is_featured = schema.shape.is_featured.optional();
  return z.object({
    search: z.string().optional(),
    category_id,
    is_active,
    is_featured,
  });
};

const getByIdValidation = () => {
  const schema = productValidation();
  return schema.pick({ id: true });
};

const insertValidation = () => {
  const schema = productValidation();
  const category_id = schema.shape.category_id.optional();
  const description = schema.shape.description.optional();
  const compare_at_price = schema.shape.compare_at_price.optional();
  const cost = schema.shape.cost.optional();
  const sku = schema.shape.sku.optional();
  const stock_quantity = schema.shape.stock_quantity.optional();
  const low_stock_threshold = schema.shape.low_stock_threshold.optional();
  const allow_backorder = schema.shape.allow_backorder.optional();
  const images = schema.shape.images.optional();
  const meta_title = schema.shape.meta_title.optional();
  const meta_description = schema.shape.meta_description.optional();
  const is_active = schema.shape.is_active.optional();
  const is_featured = schema.shape.is_featured.optional();
  return schema
    .omit({
      id: true,
      created_at: true,
      updated_at: true,
    })
    .extend({
      category_id,
      description,
      compare_at_price,
      cost,
      sku,
      stock_quantity,
      low_stock_threshold,
      allow_backorder,
      images,
      meta_title,
      meta_description,
      is_active,
      is_featured,
    });
};

const updateValidation = () => {
  const schema = productValidation();
  const id = schema.shape.id;
  return productValidation()
    .omit({
      created_at: true,
      updated_at: true,
    })
    .partial()
    .extend({ id });
};

const deleteValidation = () => {
  const schema = productValidation();
  return schema.pick({ id: true });
};

export const vProduct = {
  db: productValidation,
  metadata: metadataValidation,
  form: formValidation,
  uiForm: uiFormValidation,
  count: countValidation,
  selectByRange: selectByRangeValidation,
  select: selectValidation,
  getById: getByIdValidation,
  insert: insertValidation,
  update: updateValidation,
  delete: deleteValidation,
};
