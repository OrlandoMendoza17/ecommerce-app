import { z } from 'zod';
import { zUuid } from './common.validations';

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

export const vReview = {
  db: reviewValidation,
  form: formValidation,
  getById: getByIdValidation,
  paginated: paginatedValidation,
  insert: insertValidation,
  update: updateValidation,
  delete: deleteValidation,
};
