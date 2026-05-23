import { z } from "zod";
import { schema } from "./CategoriesForm.helpers";

export type CategoryForm = z.infer<typeof schema>;

export type CategoriesFormProps = {
  category?: Category;
};
