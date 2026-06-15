import { router, publicProcedure, protectedProcedure } from '@/trpc';
import { vProductVariant } from '@/validations/product_variants.validations';
import { TRPCError } from '@trpc/server';
import { getAvailableStock } from '@/lib/cart-stock';

export interface VariantWithOptions {
  id: string;
  product_id: string;
  sku: string;
  price: number;
  compare_at_price: number;
  cost: number;
  /** Stock físico en almacén */
  stock_quantity: number;
  /** Unidades reservadas por pedidos abiertos */
  reserved_quantity: number;
  /** Unidades vendibles (stock - reservado) */
  available_quantity: number;
  low_stock_threshold: number;
  allow_backorder: boolean;
  images: string[];
  is_active: boolean;
  option_value_ids: string[];
  options: { type_name: string; value: string; option_value_id: string }[];
}

type VariantOptionValueRow = {
  option_value_id: string;
  product_option_values?: {
    id: string;
    value: string;
    product_option_types?: { id: string; name: string; display_order?: number } | { id: string; name: string; display_order?: number }[];
  } | null;
};

type VariantRow = {
  id: string;
  product_id: string;
  sku: string;
  price: number;
  compare_at_price: number;
  cost: number;
  stock_quantity: number;
  reserved_quantity?: number;
  low_stock_threshold: number;
  allow_backorder: boolean;
  images: unknown;
  is_active: boolean;
  variant_option_values?: VariantOptionValueRow[] | null;
};

function resolveOptionTypeName(
  optionType: { name?: string } | { name?: string }[] | null | undefined
): string {
  if (!optionType) return '';
  if (Array.isArray(optionType)) return optionType[0]?.name ?? '';
  return optionType.name ?? '';
}

function mapVariantRow(variant: VariantRow): VariantWithOptions {
  const vovs = variant.variant_option_values ?? [];

  return {
    id: variant.id,
    product_id: variant.product_id,
    sku: variant.sku,
    price: variant.price,
    compare_at_price: variant.compare_at_price,
    cost: variant.cost,
    stock_quantity: variant.stock_quantity,
    reserved_quantity: variant.reserved_quantity ?? 0,
    available_quantity: getAvailableStock(
      variant.stock_quantity,
      variant.reserved_quantity ?? 0,
      variant.allow_backorder
    ),
    low_stock_threshold: variant.low_stock_threshold,
    allow_backorder: variant.allow_backorder,
    images: (variant.images as string[]) ?? [],
    is_active: variant.is_active,
    option_value_ids: vovs.map((vov) => vov.option_value_id),
    options: vovs.map((vov) => ({
      type_name: resolveOptionTypeName(vov.product_option_values?.product_option_types),
      value: vov.product_option_values?.value ?? '',
      option_value_id: vov.option_value_id,
    })),
  };
}

const VARIANT_SELECT = `
  *,
  variant_option_values(
    option_value_id,
    product_option_values(
      id,
      value,
      product_option_types(id, name, display_order)
    )
  )
`;

export const productVariantRouter = router({
  selectByProduct: publicProcedure
    .input(vProductVariant.selectByProduct())
    .query(async ({ ctx, input }) => {
      let query = ctx.supabase
        .from('product_variants')
        .select(VARIANT_SELECT)
        .eq('product_id', input.product_id)
        .order('created_at', { ascending: true });

      if (input.is_active !== undefined) {
        query = query.eq('is_active', input.is_active);
      }

      const { data, error } = await query;
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      return (data ?? []).map((variant) => mapVariantRow(variant as VariantRow));
    }),

  findByOptionValues: publicProcedure
    .input(vProductVariant.findByOptionValues())
    .query(async ({ ctx, input }): Promise<VariantWithOptions | null> => {
      const { product_id, option_value_ids } = input;
      const selectedSet = new Set(option_value_ids);
      const count = option_value_ids.length;

      const { data, error } = await ctx.supabase
        .from('product_variants')
        .select(VARIANT_SELECT)
        .eq('product_id', product_id)
        .eq('is_active', true);

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      const match = (data ?? []).find((variant) => {
        const ids = (variant.variant_option_values ?? []).map(
          (vov: VariantOptionValueRow) => vov.option_value_id
        );
        return (
          ids.length === count && ids.every((id: string) => selectedSet.has(id))
        );
      });

      return match ? mapVariantRow(match as VariantRow) : null;
    }),

  getById: publicProcedure
    .input(vProductVariant.getById())
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from('product_variants')
        .select(`
          *,
          variant_option_values(
            option_value_id,
            product_option_values(id, value, product_option_types(id, name, display_order))
          )
        `)
        .eq('id', input.id)
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data;
    }),

  insert: protectedProcedure
    .input(vProductVariant.insert())
    .mutation(async ({ ctx, input }) => {
      const { option_value_ids, ...variantData } = input;

      const { data: variant, error } = await ctx.supabase
        .from('product_variants')
        .insert(variantData)
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      if (option_value_ids && option_value_ids.length > 0) {
        const links = option_value_ids.map((id) => ({
          variant_id: variant.id,
          option_value_id: id,
        }));
        const { error: linkError } = await ctx.supabase
          .from('variant_option_values')
          .insert(links);
        if (linkError) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: linkError.message });
      }

      return variant;
    }),

  update: protectedProcedure
    .input(vProductVariant.update())
    .mutation(async ({ ctx, input }) => {
      const { id, option_value_ids, ...rest } = input;

      const { data: variant, error } = await ctx.supabase
        .from('product_variants')
        .update({ ...rest, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      if (option_value_ids !== undefined) {
        await ctx.supabase
          .from('variant_option_values')
          .delete()
          .eq('variant_id', id);

        if (option_value_ids.length > 0) {
          const links = option_value_ids.map((ovId) => ({
            variant_id: id,
            option_value_id: ovId,
          }));
          const { error: linkError } = await ctx.supabase
            .from('variant_option_values')
            .insert(links);
          if (linkError) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: linkError.message });
        }
      }

      return variant;
    }),

  delete: protectedProcedure
    .input(vProductVariant.delete())
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from('product_variants')
        .delete()
        .eq('id', input.id);

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return { success: true };
    }),

  bulkUpsert: protectedProcedure
    .input(vProductVariant.bulkUpsert())
    .mutation(async ({ ctx, input }) => {
      const { product_id, variants } = input;
      const results = [];

      for (const variant of variants) {
        const { option_value_ids, id, ...variantData } = variant;

        let savedVariant;
        if (id) {
          const { data, error } = await ctx.supabase
            .from('product_variants')
            .update({ ...variantData, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
          if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
          savedVariant = data;
        } else {
          const { data, error } = await ctx.supabase
            .from('product_variants')
            .insert({ ...variantData, product_id })
            .select()
            .single();
          if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
          savedVariant = data;
        }

        await ctx.supabase
          .from('variant_option_values')
          .delete()
          .eq('variant_id', savedVariant.id);

        const validOptionIds = option_value_ids.filter((id) =>
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
        );

        if (validOptionIds.length > 0) {
          const links = validOptionIds.map((ovId) => ({
            variant_id: savedVariant.id,
            option_value_id: ovId,
          }));
          const { error: linkError } = await ctx.supabase
            .from('variant_option_values')
            .insert(links);
          if (linkError) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: linkError.message });
          }
        }

        results.push(savedVariant);
      }

      // Sincronizar price del padre con el mínimo de variantes activas
      const { data: minData } = await ctx.supabase
        .from('product_variants')
        .select('price, compare_at_price')
        .eq('product_id', product_id)
        .eq('is_active', true)
        .order('price', { ascending: true })
        .limit(1);

      if (minData && minData.length > 0) {
        await ctx.supabase
          .from('products')
          .update({
            price: minData[0].price,
            compare_at_price: minData[0].compare_at_price,
            updated_at: new Date().toISOString(),
          })
          .eq('id', product_id);
      }

      return results;
    }),
});
