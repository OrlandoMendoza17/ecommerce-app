import { z } from "zod";
import { schema } from "./ReviewFormView.helpers";

export type ReviewFormValues = z.infer<typeof schema>;

export interface ReviewFormViewProps {
  id: string;
}
