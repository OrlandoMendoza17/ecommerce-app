import { z } from "zod";

const itemTypesSchema = z.union([
  z.literal("text"),
  z.literal("boolean"),
  z.literal("select"),
  z.literal("date")
]);

const filterOptionSchema = z.union([
  z.string(),
  z.object({
    value: z.string(),
    label: z.string(),
  }),
]);

const itemSchema = z.object({
  label: z.string(),
  value: z.string(),
  operator: z.string(),
  type: itemTypesSchema,
  options: z.array(filterOptionSchema).optional()
});

export const schema = z.object({
  filters: z.array(itemSchema)
});

export const defaultValues = { filters: [] as string[] };
