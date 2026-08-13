import { z } from 'zod';
import { vCommon, zUuid } from './common.validations';

const PRODUCT_CONDITIONS = ['new', 'used', 'refurbished'] as const;

const productValidation = () =>
  z.object({
    id: zUuid(),
    category_id: zUuid().nullable(),
    brand_id: zUuid().nullable(),
    name: z.string().min(1, { message: 'El nombre es obligatorio' }),
    slug: z.string().min(1, { message: 'El slug es obligatorio' }),
    description: z.string(),

    // Resumen de catálogo (derivado de variantes)
    price: z.coerce.number<number>().min(0),
    compare_at_price: z.coerce.number<number>().min(0),

    // Atributos de catálogo
    condition: z.enum(PRODUCT_CONDITIONS),
    is_digital: z.boolean(),
    tags: z.array(z.string()).default([]),
    attributes: z.record(z.string(), z.unknown()).default({}),

    // Imágenes generales
    images: z.array(z.string()).default([]),

    // SEO
    meta_title: z.string(),
    meta_description: z.string(),

    // Estado
    is_active: z.boolean(),
    is_featured: z.boolean(),

    created_at: z.date({ message: 'Formato de fecha y hora no válido' }).optional(),
    updated_at: z.date({ message: 'Formato de fecha y hora no válido' }).optional(),
  });

const metadataValidation = () =>
  productValidation().omit({ created_at: true, updated_at: true });

const formValidation = () =>
  productValidation().omit({ id: true, created_at: true, updated_at: true });

const uiFormValidation = () =>
  productValidation()
    .omit({ id: true, created_at: true, updated_at: true, images: true })
    .extend({
      image_files: z.array(z.instanceof(File)).optional(),
      tags: z.array(z.string()).default([]),
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
  const schema = productValidation();
  return z.object({
    search: z.string().optional(),
    category_id: schema.shape.category_id.optional(),
    brand_id: schema.shape.brand_id.optional(),
    is_active: schema.shape.is_active.optional(),
    is_featured: schema.shape.is_featured.optional(),
    condition: z.enum(PRODUCT_CONDITIONS).optional(),
    tags: z.array(z.string()).optional(),
  });
};

const getByIdValidation = () => productValidation().pick({ id: true });

const getBySlugValidation = () => productValidation().pick({ slug: true });

const insertValidation = () =>
  productValidation()
    .omit({ id: true, created_at: true, updated_at: true })
    .partial({
      category_id: true,
      brand_id: true,
      description: true,
      price: true,
      compare_at_price: true,
      condition: true,
      is_digital: true,
      tags: true,
      attributes: true,
      images: true,
      meta_title: true,
      meta_description: true,
      is_active: true,
      is_featured: true,
    });

const updateValidation = () => {
  const id = productValidation().shape.id;
  return productValidation()
    .omit({ created_at: true, updated_at: true })
    .partial()
    .extend({ id });
};

const deleteValidation = () => productValidation().pick({ id: true });

const STORE_SORT_OPTIONS = [
  'featured',
  'price-asc',
  'price-desc',
  'newest',
  'name',
] as const;

const storeCatalogBaseValidation = () =>
  z.object({
    q: z.string().optional(),
    category_id: zUuid().optional(),
    is_featured: z.boolean().optional(),
    price_min: z.coerce.number<number>().min(0).optional(),
    price_max: z.coerce.number<number>().min(0).optional(),
    in_stock_only: z.boolean().optional(),
    sort: z.enum(STORE_SORT_OPTIONS).default('featured'),
  });

const storeCatalogCountValidation = () => storeCatalogBaseValidation();

const storeCatalogListValidation = () => {
  const extras = storeCatalogBaseValidation();
  return vCommon.selectByRange(extras, 100);
};

export const vProduct = {
  db: productValidation,
  metadata: metadataValidation,
  form: formValidation,
  uiForm: uiFormValidation,
  count: countValidation,
  selectByRange: selectByRangeValidation,
  select: selectValidation,
  storeCatalogCount: storeCatalogCountValidation,
  storeCatalogList: storeCatalogListValidation,
  getById: getByIdValidation,
  getBySlug: getBySlugValidation,
  insert: insertValidation,
  update: updateValidation,
  delete: deleteValidation,
};
