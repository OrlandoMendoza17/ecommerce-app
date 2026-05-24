import { router, publicProcedure, protectedProcedure } from "@/trpc";
import { vPaymentMethod } from "@/validations/payment_methods.validations";

export const paymentMethodRouter = router({
  select: publicProcedure
    .input(vPaymentMethod.select())
    .query(async (options) => {
      const { input, ctx } = options;
      const { is_active } = input;

      let query = ctx.supabase
        .from("payment_methods")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (is_active !== undefined) {
        query = query.eq("is_active", is_active);
      }

      const { data, error } = await query.overrideTypes<PaymentMethod[]>();
      if (error) throw new Error(error.message);
      return data;
    }),

  getById: publicProcedure
    .input(vPaymentMethod.getById())
    .query(async (options) => {
      const { input, ctx } = options;

      const { data, error } = await ctx.supabase
        .from("payment_methods")
        .select("*")
        .eq("id", input.id)
        .is("deleted_at", null)
        .limit(1)

      if (error) {
        if (error.code === "PGRST116") {
          return null;
        }
        throw new Error(error.message);
      }

      return data[0] ?? null;
    }),

  insert: protectedProcedure
    .input(vPaymentMethod.insert())
    .mutation(async (options) => {
      const { input, ctx } = options;
      if (!ctx.user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await ctx.supabase
        .from("payment_methods")
        .insert(input)
        .select()
        .single()

      if (error) throw new Error(error.message);
      return data;
    }),

  update: protectedProcedure
    .input(vPaymentMethod.update())
    .mutation(async (options) => {
      const { input, ctx } = options;
      const { id } = input;

      const updated_at = new Date().toISOString();
      const updatedPaymentMethod = { ...input, updated_at };

      const { data, error } = await ctx.supabase
        .from("payment_methods")
        .update(updatedPaymentMethod)
        .eq("id", id)
        .is("deleted_at", null)
        .select("*")
        .single()
        .overrideTypes<PaymentMethod>();

      if (error) throw new Error(error.message);
      return data;
    }),

  delete: protectedProcedure
    .input(vPaymentMethod.delete())
    .mutation(async (options) => {
      const { input, ctx } = options;
      const { id } = input;

      const { error } = await ctx.supabase
        .from("payment_methods")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw new Error(error.message);
    }),
});
