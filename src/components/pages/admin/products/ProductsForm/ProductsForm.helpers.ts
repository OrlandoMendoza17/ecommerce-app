import { z } from "zod";
import { vProduct } from "@/validations/products.validations";

export const NO_CATEGORY_VALUE = "__none__";

const baseFormSchema = vProduct.uiForm().omit({
  category_id: true,
  price: true,
  compare_at_price: true,
});

export const schema = baseFormSchema
  .extend({
    category_id: z.union([
      z.uuid({ message: "El identificador no es válido" }),
      z.literal(NO_CATEGORY_VALUE),
    ]),
  });

export type ProductFormDefaults = z.infer<typeof schema>;

export const defaultValues: ProductFormDefaults = {
  category_id: NO_CATEGORY_VALUE,
  name: "",
  slug: "",
  description: "",
  brand: "",
  condition: "new",
  is_digital: false,
  tags: [],
  attributes: {} as Record<string, unknown>,
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
