import { z } from 'zod';
import { vCommon, zUuid } from './common.validations';

const reviewValidation = () =>
  z.object({
    id: zUuid(),
    product_id: zUuid(),
    profile_id: zUuid(),
    order_id: zUuid().nullable().optional(),
    rating: z.coerce.number<number>().min(1).max(5),
    title: z.string().max(200),
    comment: z.string().max(1500),
    is_approved: z.boolean(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  });

const formValidation = () =>
  z.object({
    rating: z.coerce.number<number>().min(1, { message: 'La calificación es obligatoria' }).max(5),
    title: z.string().max(200),
    comment: z.string().max(1500, { message: 'El comentario no puede superar 1500 caracteres' }),
  });

const getByIdValidation = () => reviewValidation().pick({ id: true });

const insertValidation = () =>
  z.object({
    product_id: zUuid(),
    order_id: zUuid().nullable().optional(),
    rating: z.coerce.number<number>().min(1).max(5),
  });

const updateValidation = () =>
  z.object({
    id: zUuid(),
    rating: z.coerce.number<number>().min(1).max(5).optional(),
    title: z.string().max(200).optional(),
    comment: z.string().max(1500).optional(),
  });

const deleteValidation = () => reviewValidation().pick({ id: true });

const paginatedValidation = () =>
  z.object({
    from: z.number().min(0),
    to: z.number().min(0),
  });

const getProductSummaryValidation = () =>
  z.object({
    product_id: zUuid(),
  });

const listByProductValidation = () =>
  z.object({
    product_id: zUuid(),
    from: z.number().min(0),
    to: z.number().min(0),
    rating: z.coerce.number<number>().int().min(1).max(5).optional(),
    sort: z.enum(["recent", "rating_desc"]).default("recent"),
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

const setApprovedValidation = () =>
  z.object({
    id: zUuid(),
    is_approved: z.boolean(),
  });

export const vReview = {
  db: reviewValidation,
  form: formValidation,
  getById: getByIdValidation,
  paginated: paginatedValidation,
  getProductSummary: getProductSummaryValidation,
  listByProduct: listByProductValidation,
  count: countValidation,
  selectByRange: selectByRangeValidation,
  setApproved: setApprovedValidation,
  insert: insertValidation,
  update: updateValidation,
  delete: deleteValidation,
};
