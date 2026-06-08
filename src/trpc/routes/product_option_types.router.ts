import { router, publicProcedure, protectedProcedure } from '@/trpc';
import { vProductOptionType } from '@/validations/product_option_types.validations';
import { TRPCError } from '@trpc/server';

export const productOptionTypeRouter = router({
  selectByProduct: publicProcedure
    .input(vProductOptionType.selectByProduct())
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from('product_option_types')
        .select('*, product_option_values(id, value, display_order)')
        .eq('product_id', input.product_id)
        .order('display_order', { ascending: true });

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      return (data ?? []).map((t) => ({
        ...t,
        product_option_values: (t.product_option_values ?? []).sort(
          (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
        ),
      }));
    }),

  insert: protectedProcedure
    .input(vProductOptionType.insert())
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from('product_option_types')
        .insert(input)
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data;
    }),

  update: protectedProcedure
    .input(vProductOptionType.update())
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;
      const { data, error } = await ctx.supabase
        .from('product_option_types')
        .update({ ...rest, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data;
    }),

  delete: protectedProcedure
    .input(vProductOptionType.delete())
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from('product_option_types')
        .delete()
        .eq('id', input.id);

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return { success: true };
    }),
});
