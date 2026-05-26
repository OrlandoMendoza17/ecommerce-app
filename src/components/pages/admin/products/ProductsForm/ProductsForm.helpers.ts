import { z } from "zod";
import { vProduct } from "@/validations/products.validations";

export const NO_CATEGORY_VALUE = "__none__";

const baseFormSchema = vProduct.uiForm().omit({
  category_id: true,
});

export const schema = baseFormSchema
  .extend({
    category_id: z.union([
      z.uuid({ message: "El identificador no es válido" }),
      z.literal(NO_CATEGORY_VALUE),
    ]),
  })
  .refine((data) => data.compare_at_price >= data.price, {
    message: "El precio comparativo debe ser mayor o igual al precio de venta",
    path: ["compare_at_price"],
  });

export type ProductFormDefaults = z.infer<typeof schema>;

export const defaultValues: ProductFormDefaults = {
  category_id: NO_CATEGORY_VALUE,
  name: "",
  slug: "",
  description: "",
  price: 0,
  compare_at_price: 0,
  cost: 0,
  sku: "",
  stock_quantity: 0,
  low_stock_threshold: 0,
  allow_backorder: false,
  image_files: [] as File[],
  meta_title: "",
  meta_description: "",
  is_active: false,
  is_featured: false,
};

export const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
