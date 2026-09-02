import { z } from "zod";
import { vReview } from "@/validations/reviews.validations";

export const schema = vReview.form();

export type ReviewFormValues = z.infer<typeof schema>;

export const defaultValues: ReviewFormValues = {
  rating: 0,
  title: "",
  comment: "",
};
