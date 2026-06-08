import { z } from 'zod';
import { zUuid } from './common.validations';

const optionValueValidation = () =>
  z.object({
    id: zUuid(),
    option_type_id: zUuid(),
    value: z.string().min(1, { message: 'El valor es obligatorio' }),
    display_order: z.coerce.number<number>().int().min(0).default(0),
    created_at: z.date().optional(),
    updated_at: z.date().optional(),
  });

const selectByTypeValidation = () =>
  z.object({ option_type_id: zUuid() });

const getByIdValidation = () => optionValueValidation().pick({ id: true });

const insertValidation = () =>
  optionValueValidation()
    .omit({ id: true, created_at: true, updated_at: true })
    .partial({ display_order: true });

const updateValidation = () => {
  const id = optionValueValidation().shape.id;
  return optionValueValidation()
    .omit({ created_at: true, updated_at: true })
    .partial()
    .extend({ id });
};

const deleteValidation = () => optionValueValidation().pick({ id: true });

export const vProductOptionValue = {
  db: optionValueValidation,
  selectByType: selectByTypeValidation,
  getById: getByIdValidation,
  insert: insertValidation,
  update: updateValidation,
  delete: deleteValidation,
};
