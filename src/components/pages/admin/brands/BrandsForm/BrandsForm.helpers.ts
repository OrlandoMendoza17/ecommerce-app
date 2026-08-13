import { z } from "zod";
import { vBrand } from "@/validations/brands.validations";

const baseFormSchema = vBrand.form().omit({
  image_url: true,
});

export const schema = baseFormSchema.extend({
  image_url: z.array(z.union([z.string(), z.instanceof(File)])).min(0),
});

export type BrandFormDefaults = z.infer<typeof schema>;

export const defaultValues: BrandFormDefaults = {
  name: "",
  image_url: [],
  display_order: 0,
  is_active: true,
};
