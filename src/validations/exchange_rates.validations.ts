import { z } from "zod";

const exchangeRateValidation = () =>
  z.object({
    id: z.uuid(),
    currency: z.enum(["USD", "EUR", "VES"]),
    USD: z.number(),
    EUR: z.number(),
    created_at: z.coerce.date(),
  });

const selectValidation = () => z.object({});

export const vExchangeRate = {
  db: exchangeRateValidation,
  select: selectValidation,
};
