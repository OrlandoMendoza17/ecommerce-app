import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "@/trpc";
import { vExchangeRate } from "@/validations/exchange_rates.validations";

export const exchangeRateRouter = router({
  select: publicProcedure
    .input(vExchangeRate.select())
    .query(async ({ ctx }) => {
      const { data, error } = await ctx.supabase
        .from("exchange_rates")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return data ?? null;
    }),
});
