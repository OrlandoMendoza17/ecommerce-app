import { TRPCError } from '@trpc/server';
import { revalidateTag } from 'next/cache';
import { router, publicProcedure, protectedProcedure } from '@/trpc';
import { vStoreSettings } from '@/validations/store_settings.validations';

export const storeSettingsRouter = router({
  get: publicProcedure.query(async ({ ctx }): Promise<StoreSettings | null> => {
    const { data, error } = await ctx.supabase
      .from('store_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }

    return (data ?? null) as StoreSettings | null;
  }),

  update: protectedProcedure
    .input(vStoreSettings.update())
    .mutation(async ({ ctx, input }): Promise<StoreSettings> => {
      const { id, ...fields } = input;
      const updated_at = new Date().toISOString();

      const { data, error } = await ctx.supabase
        .from('store_settings')
        .update({ ...fields, updated_at })
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }

      revalidateTag('store-settings', 'max');

      return data as StoreSettings;
    }),
});
