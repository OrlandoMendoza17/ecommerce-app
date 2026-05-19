import { z } from "zod";

const MAX_PAGE_SIZE = 100;

export const filtersValidation = () => {
  const filter = z.object({
    label: z.string().trim(),
    value: z.string().trim(),
    operator: z.string().trim(),
  });
  return z.array(filter);
};

export const selectByRangeValidation = <T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  limit = MAX_PAGE_SIZE
) => {
  const invalidRangeLimits =
    `Invalid range. 'from' must be less than or equal to 'to'`;
  const invalidRangeDistance =
    `Invalid range, range cannot exceed ${limit} records.`;

  const extendedSchema = schema.extend({
    from: z.number().int().min(0),
    to: z.number().int().min(0),
  });

  type ExtendedData = z.infer<typeof extendedSchema> & {
    from: number;
    to: number;
  };

  return extendedSchema
    .refine(
      (data): data is ExtendedData => {
        const d = data as ExtendedData;
        return d.from <= d.to;
      },
      invalidRangeLimits
    )
    .refine(
      (data): data is ExtendedData => {
        const d = data as ExtendedData;
        return d.to - d.from <= limit;
      },
      invalidRangeDistance
    );
};

export const vCommon = {
  filters: filtersValidation,
  selectByRange: selectByRangeValidation,
};
