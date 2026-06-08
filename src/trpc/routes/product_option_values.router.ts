import { router, publicProcedure, protectedProcedure } from '@/trpc';
import { vProductOptionValue } from '@/validations/product_option_values.validations';
import { TRPCError } from '@trpc/server';

export const productOptionValueRouter = router({
  selectByType: publicProcedure
    .input(vProductOptionValue.selectByType())
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from('product_option_values')
        .select('*')
        .eq('option_type_id', input.option_type_id)
        .order('display_order', { ascending: true });

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data ?? [];
    }),

  insert: protectedProcedure
    .input(vProductOptionValue.insert())
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from('product_option_values')
        .insert(input)
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data;
    }),

  update: protectedProcedure
    .input(vProductOptionValue.update())
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;
      const { data, error } = await ctx.supabase
        .from('product_option_values')
        .update({ ...rest, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data;
    }),

  delete: protectedProcedure
    .input(vProductOptionValue.delete())
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from('product_option_values')
        .delete()
        .eq('id', input.id);

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return { success: true };
    }),
});
