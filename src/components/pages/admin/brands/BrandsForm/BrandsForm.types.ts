import { z } from "zod";
import { schema } from "./BrandsForm.helpers";

export type BrandForm = z.infer<typeof schema>;

export type BrandsFormProps = {
  brand?: Brand;
};
