import { TRPCError } from '@trpc/server';
import { router, publicProcedure } from '@/trpc';
import { vCart } from '@/validations/cart.validations';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getAvailableStock, stockExceededMessage } from '@/lib/cart-stock';

export interface ServerCartItem {
  id: string;
  quantity: number;
  customization_text: string;
  customization_notes: string;
  product: {
    id: string;
    name: string;
    slug: string;
    images: string[];
    is_active: boolean;
  } | null;
  variant: {
    id: string;
    sku: string;
    price: number;
    compare_at_price: number;
    stock_quantity: number;
    allow_backorder: boolean;
    images: string[];
    is_active: boolean;
    options: { type_name: string; value: string }[];
  } | null;
}

type VariantStockRow = {
  stock_quantity: number;
  reserved_quantity: number;
  allow_backorder: boolean;
  is_active: boolean;
};

async function getVariantStock(
  supabase: SupabaseClient,
  variantId: string
): Promise<VariantStockRow> {
  const { data, error } = await supabase
    .from('product_variants')
    .select('stock_quantity, reserved_quantity, allow_backorder, is_active')
    .eq('id', variantId)
    .single();

  if (error || !data) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Variante no encontrada' });
  }

  return data as VariantStockRow;
}

function assertQuantityWithinStock(
  requestedQuantity: number,
  variant: VariantStockRow
): void {
  if (!variant.is_active) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Esta variante ya no está disponible',
    });
  }

  const available = getAvailableStock(
    variant.stock_quantity,
    variant.reserved_quantity ?? 0,
    variant.allow_backorder
  );

  if (!variant.allow_backorder && requestedQuantity > available) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: stockExceededMessage(available),
    });
  }
}

async function getOrCreateCart(supabase: SupabaseClient, userId: string): Promise<string> {
  const { data: existing } = await supabase
    .from('cart')
    .select('id')
    .eq('profile_id', userId)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from('cart')
    .insert({ profile_id: userId, session_id: '' })
    .select('id')
    .single();

  if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
  return created.id;
}

export const cartRouter = router({
  summary: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return { count: 0, subtotal: 0 };

    const cartId = await getOrCreateCart(ctx.supabase, ctx.user.id);

    const { data, error } = await ctx.supabase
      .from('cart_items')
      .select('quantity, variant:product_variants(price)')
      .eq('cart_id', cartId);

    if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

    const count = data.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = data.reduce((sum, item) => {
      const price = (item.variant as { price: number } | null)?.price ?? 0;
      return sum + price * item.quantity;
    }, 0);

    return { count, subtotal };
  }),

  list: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return [];

    const cartId = await getOrCreateCart(ctx.supabase, ctx.user.id);

    const { data, error } = await ctx.supabase
      .from('cart_items')
      .select(`
        id,
        quantity,
        customization_text,
        customization_notes,
        product:products(id, name, slug, images, is_active),
        variant:product_variants(
          id, sku, price, compare_at_price, stock_quantity, reserved_quantity, allow_backorder, images, is_active,
          variant_option_values(
            option_value_id,
            product_option_values(value, product_option_types(name, display_order))
          )
        )
      `)
      .eq('cart_id', cartId)
      .order('created_at', { ascending: true });

    if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

    return (data ?? []).map((item) => {
      const variant = item.variant as any;
      const options =
        (variant?.variant_option_values ?? []).map((vov: any) => ({
          type_name: vov.product_option_values?.product_option_types?.name ?? '',
          value: vov.product_option_values?.value ?? '',
        })) ?? [];

      return {
        id: item.id,
        quantity: item.quantity,
        customization_text: item.customization_text,
        customization_notes: item.customization_notes,
        product: item.product as ServerCartItem['product'],
        variant: variant
          ? {
              id: variant.id,
              sku: variant.sku,
              price: variant.price,
              compare_at_price: variant.compare_at_price,
              stock_quantity: variant.stock_quantity,
              allow_backorder: variant.allow_backorder ?? false,
              images: (variant.images as string[]) ?? [],
              is_active: variant.is_active,
              options,
            }
          : null,
      } as ServerCartItem;
    });
  }),

  addItem: publicProcedure.input(vCart.addItem()).mutation(async ({ ctx, input }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

    const cartId = await getOrCreateCart(ctx.supabase, ctx.user.id);
    const variant = await getVariantStock(ctx.supabase, input.variant_id);

    const { data: existing } = await ctx.supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('cart_id', cartId)
      .eq('variant_id', input.variant_id)
      .maybeSingle();

    assertQuantityWithinStock(input.quantity, variant);

    if (existing) {
      const { error } = await ctx.supabase
        .from('cart_items')
        .update({ quantity: input.quantity })
        .eq('id', existing.id);
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
    } else {
      const { error } = await ctx.supabase.from('cart_items').insert({
        cart_id: cartId,
        product_id: input.product_id,
        variant_id: input.variant_id,
        quantity: input.quantity,
        customization_text: input.customization_text,
        customization_notes: input.customization_notes,
      });
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }

    return { success: true };
  }),

  updateItem: publicProcedure.input(vCart.updateItem()).mutation(async ({ ctx, input }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

    if (input.quantity === 0) {
      const { error } = await ctx.supabase
        .from('cart_items')
        .delete()
        .eq('id', input.cart_item_id);
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
    } else {
      const { data: cartItem, error: cartItemError } = await ctx.supabase
        .from('cart_items')
        .select('variant_id')
        .eq('id', input.cart_item_id)
        .single();

      if (cartItemError || !cartItem) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Producto del carrito no encontrado' });
      }

      const variant = await getVariantStock(ctx.supabase, cartItem.variant_id);
      assertQuantityWithinStock(input.quantity, variant);

      const { error } = await ctx.supabase
        .from('cart_items')
        .update({ quantity: input.quantity })
        .eq('id', input.cart_item_id);
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }

    return { success: true };
  }),

  removeItem: publicProcedure.input(vCart.removeItem()).mutation(async ({ ctx, input }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

    const { error } = await ctx.supabase
      .from('cart_items')
      .delete()
      .eq('id', input.cart_item_id);

    if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
    return { success: true };
  }),

  clear: publicProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

    const { data: cart } = await ctx.supabase
      .from('cart')
      .select('id')
      .eq('profile_id', ctx.user.id)
      .maybeSingle();

    if (!cart) return { success: true };

    const { error } = await ctx.supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cart.id);

    if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
    return { success: true };
  }),

  mergeGuest: publicProcedure.input(vCart.mergeGuest()).mutation(async ({ ctx, input }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
    if (input.items.length === 0) return { success: true };

    const cartId = await getOrCreateCart(ctx.supabase, ctx.user.id);

    for (const item of input.items) {
      const variant = await getVariantStock(ctx.supabase, item.variant_id);

      const { data: existing } = await ctx.supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('cart_id', cartId)
        .eq('variant_id', item.variant_id)
        .maybeSingle();

      const nextQuantity = (existing?.quantity ?? 0) + item.quantity;
      assertQuantityWithinStock(nextQuantity, variant);

      if (existing) {
        await ctx.supabase
          .from('cart_items')
          .update({ quantity: nextQuantity })
          .eq('id', existing.id);
      } else {
        await ctx.supabase.from('cart_items').insert({
          cart_id: cartId,
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          customization_text: item.customization_text,
          customization_notes: item.customization_notes,
        });
      }
    }

    return { success: true };
  }),
});
