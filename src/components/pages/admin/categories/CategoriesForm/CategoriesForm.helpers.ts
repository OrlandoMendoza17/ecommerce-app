import { z } from "zod";
import { vCategory } from "@/validations/categories.validations";

export const NO_PARENT_VALUE = "__none__";

const baseFormSchema = vCategory.form().omit({
  image_url: true,
  parent_id: true,
});

export const schema = baseFormSchema.extend({
  image_url: z
    .array(z.union([z.string(), z.instanceof(File)]))
    .min(0),
  parent_id: z.union([
    z.uuid({ message: "El identificador no es válido" }),
    z.literal(NO_PARENT_VALUE),
  ]),
});

export type CategoryFormDefaults = z.infer<typeof schema>;

export const defaultValues: CategoryFormDefaults = {
  name: "",
  slug: "",
  description: "",
  image_url: [],
  parent_id: NO_PARENT_VALUE,
  display_order: 0,
  is_active: true,
};

export const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
