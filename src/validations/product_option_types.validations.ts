import { z } from 'zod';
import { zUuid } from './common.validations';

const optionTypeValidation = () =>
  z.object({
    id: zUuid(),
    product_id: zUuid(),
    name: z.string().min(1, { message: 'El nombre es obligatorio' }),
    display_order: z.coerce.number<number>().int().min(0).default(0),
    created_at: z.date().optional(),
    updated_at: z.date().optional(),
  });

const selectByProductValidation = () =>
  z.object({ product_id: zUuid() });

const getByIdValidation = () => optionTypeValidation().pick({ id: true });

const insertValidation = () =>
  optionTypeValidation()
    .omit({ id: true, created_at: true, updated_at: true })
    .partial({ display_order: true });

const updateValidation = () => {
  const id = optionTypeValidation().shape.id;
  return optionTypeValidation()
    .omit({ created_at: true, updated_at: true })
    .partial()
    .extend({ id });
};

const deleteValidation = () => optionTypeValidation().pick({ id: true });

export const vProductOptionType = {
  db: optionTypeValidation,
  selectByProduct: selectByProductValidation,
  getById: getByIdValidation,
  insert: insertValidation,
  update: updateValidation,
  delete: deleteValidation,
};
