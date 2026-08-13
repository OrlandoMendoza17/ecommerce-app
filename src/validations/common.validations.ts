import { z } from "zod";

const MAX_PAGE_SIZE = 100;

export const zUuid = () => z.uuid({ message: 'El identificador no es válido' });

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
    `Rango no válido. 'from' debe ser menor o igual que 'to'`;
  const invalidRangeDistance =
    `Rango no válido, el rango no puede superar los ${limit} registros.`;

  const extendedSchema = schema.extend({
    from: z.number().int().min(0, { message: 'El índice inicial debe ser al menos 0' }),
    to: z.number().int().min(0, { message: 'El índice final debe ser al menos 0' }),
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

const mimeTypeValidation = () => {
  const mimeTypePattern = z.union([
    z.string().regex(/^application\/[a-zA-Z0-9.\-+]+$/),
    z.string().regex(/^audio\/[a-zA-Z0-9.\-+]+$/),
    z.string().regex(/^image\/[a-zA-Z0-9.\-+]+$/),
    z.string().regex(/^video\/[a-zA-Z0-9.\-+]+$/),
    z.string().regex(/^application\/\*$/),
    z.string().regex(/^audio\/\*$/),
    z.string().regex(/^image\/\*$/),
    z.string().regex(/^video\/\*$/)
  ]);
  return z.array(mimeTypePattern);
};

export const vCommon = {
  filters: filtersValidation,
  selectByRange: selectByRangeValidation,
  mimeType: mimeTypeValidation,
};
