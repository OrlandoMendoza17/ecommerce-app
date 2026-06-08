import { z } from 'zod';
import { zUuid } from './common.validations';

const variantValidation = () =>
  z.object({
    id: zUuid(),
    product_id: zUuid(),
    sku: z.string(),
    price: z.coerce.number<number>().min(0, { message: 'El precio debe ser al menos 0' }),
    compare_at_price: z.coerce.number<number>().min(0),
    cost: z.coerce.number<number>().min(0),
    stock_quantity: z.coerce.number<number>().int().min(0),
    low_stock_threshold: z.coerce.number<number>().int().min(0),
    allow_backorder: z.boolean(),
    images: z.array(z.string()).default([]),
    is_active: z.boolean(),
    created_at: z.date().optional(),
    updated_at: z.date().optional(),
  });

const selectByProductValidation = () =>
  z.object({
    product_id: zUuid(),
    is_active: z.boolean().optional(),
  });

const getByIdValidation = () => variantValidation().pick({ id: true });

const insertValidation = () =>
  variantValidation()
    .omit({ id: true, created_at: true, updated_at: true })
    .extend({
      option_value_ids: z.array(zUuid()).default([]),
    })
    .partial({
      sku: true,
      compare_at_price: true,
      cost: true,
      stock_quantity: true,
      low_stock_threshold: true,
      allow_backorder: true,
      images: true,
      is_active: true,
    });

const updateValidation = () => {
  const id = variantValidation().shape.id;
  return variantValidation()
    .omit({ created_at: true, updated_at: true })
    .partial()
    .extend({
      id,
      option_value_ids: z.array(zUuid()).optional(),
    });
};

const deleteValidation = () => variantValidation().pick({ id: true });

const findByOptionValuesValidation = () =>
  z.object({
    product_id: zUuid(),
    option_value_ids: z.array(zUuid()).min(1),
  });

const bulkUpsertValidation = () =>
  z.object({
    product_id: zUuid(),
    variants: z.array(
      z.object({
        id: zUuid().optional(),
        sku: z.string().default(''),
        price: z.coerce.number<number>().min(0),
        compare_at_price: z.coerce.number<number>().min(0).default(0),
        cost: z.coerce.number<number>().min(0).default(0),
        stock_quantity: z.coerce.number<number>().int().min(0).default(0),
        low_stock_threshold: z.coerce.number<number>().int().min(0).default(0),
        allow_backorder: z.boolean().default(false),
        images: z.array(z.string()).default([]),
        is_active: z.boolean().default(true),
        option_value_ids: z.array(zUuid()).default([]),
      })
    ),
  });

export const vProductVariant = {
  db: variantValidation,
  selectByProduct: selectByProductValidation,
  getById: getByIdValidation,
  insert: insertValidation,
  update: updateValidation,
  delete: deleteValidation,
  bulkUpsert: bulkUpsertValidation,
  findByOptionValues: findByOptionValuesValidation,
};
