import { z } from 'zod';
import { zUuid } from './common.validations';

const addItemSchema = z.object({
  product_id: zUuid(),
  variant_id: zUuid(),
  quantity: z.number().int().min(1),
  customization_text: z.string().default(''),
  customization_notes: z.string().default(''),
});

const updateItemSchema = z.object({
  cart_item_id: zUuid(),
  quantity: z.number().int().min(0),
});

const removeItemSchema = z.object({
  cart_item_id: zUuid(),
});

const mergeGuestSchema = z.object({
  items: z.array(
    z.object({
      product_id: zUuid(),
      variant_id: zUuid(),
      quantity: z.number().int().min(1),
      customization_text: z.string().default(''),
      customization_notes: z.string().default(''),
    })
  ),
});

export const vCart = {
  addItem: () => addItemSchema,
  updateItem: () => updateItemSchema,
  removeItem: () => removeItemSchema,
  mergeGuest: () => mergeGuestSchema,
};
