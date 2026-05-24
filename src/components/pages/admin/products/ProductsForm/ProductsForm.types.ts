import { z } from "zod";
import { schema } from "./ProductsForm.helpers";

export type ProductForm = z.infer<typeof schema>;

export type ProductsFormProps = {
  product?: Product;
};
