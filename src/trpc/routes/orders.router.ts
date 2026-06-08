import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure } from '@/trpc';
import { vOrder } from '@/validations/orders.validations';
import { applyCustomFilters } from '@/utils/supabase/filters';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ServerCartItem } from '@/trpc/routes/cart.router';

const orderFilters = ['status', 'payment_status', 'profile_id'] as const;

const ORDER_SEARCH_OR = (q: string) =>
  `order_number.ilike.%${q}%,shipping_full_name.ilike.%${q}%,shipping_phone.ilike.%${q}%,payment_reference.ilike.%${q}%`;

function generateOrderNumber(): string {
  const yy = String(new Date().getFullYear()).slice(-2);
  const seq = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
  return `${yy}${seq}`;
}

async function getOrCreateCartId(supabase: SupabaseClient, userId: string): Promise<string | null> {
  const { data: existing } = await supabase
    .from('cart')
    .select('id')
    .eq('profile_id', userId)
    .maybeSingle();

  return existing?.id ?? null;
}

async function fetchCartItems(supabase: SupabaseClient, cartId: string): Promise<ServerCartItem[]> {
  const { data, error } = await supabase
    .from('cart_items')
    .select(`
      id,
      quantity,
      customization_text,
      customization_notes,
      product:products(id, name, slug, images, is_active),
      variant:product_variants(
        id, sku, price, compare_at_price, stock_quantity, allow_backorder, images, is_active,
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
    const variant = item.variant as unknown as {
      id: string;
      sku: string;
      price: number;
      compare_at_price: number;
      stock_quantity: number;
      allow_backorder: boolean;
      images: string[];
      is_active: boolean;
      variant_option_values?: {
        option_value_id: string;
        product_option_values?: {
          value: string;
          product_option_types?: { name: string } | { name: string }[];
        };
      }[];
    } | null;

    const options =
      (variant?.variant_option_values ?? []).map((vov) => {
        const pot = vov.product_option_values?.product_option_types;
        const typeName = Array.isArray(pot) ? (pot[0]?.name ?? '') : (pot?.name ?? '');
        return {
          type_name: typeName,
          value: vov.product_option_values?.value ?? '',
        };
      }) ?? [];

    return {
      id: item.id,
      quantity: item.quantity,
      customization_text: item.customization_text,
      customization_notes: item.customization_notes,
      product: item.product as unknown as ServerCartItem['product'],
      variant: variant
        ? {
            id: variant.id,
            sku: variant.sku,
            price: variant.price,
            compare_at_price: variant.compare_at_price,
            stock_quantity: variant.stock_quantity,
            allow_backorder: variant.allow_backorder,
            images: variant.images ?? [],
            is_active: variant.is_active,
            options,
          }
        : null,
    };
  });
}

export const ordersRouter = router({
  count: protectedProcedure
    .input(vOrder.count())
    .query(async ({ input, ctx }) => {
      const { filters: customFilters, q } = input;

      let query = ctx.supabase
        .from('orders')
        .select('id', { count: 'estimated', head: true });

      query = applyCustomFilters(query, customFilters, undefined, [...orderFilters]);

      if (q?.trim()) {
        query = query.or(ORDER_SEARCH_OR(q.trim()));
      }

      const { error, count } = await query;
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return count ?? 0;
    }),

  selectByRange: protectedProcedure
    .input(vOrder.selectByRange())
    .query(async ({ input, ctx }): Promise<OrderWithProfile[]> => {
      const { from, to, filters: customFilters, q } = input;

      let query = ctx.supabase
        .from('orders')
        .select(
          `
          id,
          order_number,
          status,
          payment_status,
          subtotal,
          total,
          shipping_full_name,
          shipping_phone,
          created_at,
          profile:profiles(id, full_name, email, phone)
        `
        )
        .order('created_at', { ascending: false });

      query = applyCustomFilters(query, customFilters, undefined, [...orderFilters]);

      if (q?.trim()) {
        query = query.or(ORDER_SEARCH_OR(q.trim()));
      }

      query = query.range(from, to);
      const { data, error } = await query;
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      return (data ?? []) as unknown as OrderWithProfile[];
    }),

  createFromCart: publicProcedure.mutation(async ({ ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Debes iniciar sesión para confirmar tu pedido',
        });
      }

      const userId = ctx.user.id;
      const cartId = await getOrCreateCartId(ctx.supabase, userId);
      if (!cartId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Tu carrito está vacío' });
      }

      const cartItems = await fetchCartItems(ctx.supabase, cartId);
      const validItems = cartItems.filter((item) => item.product?.is_active && item.variant?.is_active);

      if (validItems.length === 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Tu carrito está vacío' });
      }

      for (const item of validItems) {
        const variant = item.variant! as NonNullable<ServerCartItem['variant']> & {
          allow_backorder: boolean;
        };
        if (variant.stock_quantity < item.quantity && !variant.allow_backorder) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Stock insuficiente para "${item.product!.name}"`,
          });
        }
      }

      const { data: profile, error: profileError } = await ctx.supabase
        .from('profiles')
        .select('full_name, phone, email')
        .eq('id', userId)
        .single();

      if (profileError) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: profileError.message });
      }

      const orderNumber = generateOrderNumber();

      const { data: order, error: orderError } = await ctx.supabase
        .from('orders')
        .insert({
          profile_id: userId,
          order_number: orderNumber,
          status: 'pending',
          payment_status: 'pending',
          subtotal: 0,
          tax: 0,
          shipping_cost: 0,
          discount: 0,
          total: 0,
          shipping_full_name: profile.full_name ?? '',
          shipping_phone: profile.phone ?? '',
          shipping_address_line1: '',
          shipping_address_line2: '',
          shipping_city: '',
          shipping_state: '',
          shipping_postal_code: '',
          shipping_country: 'VE',
        })
        .select('id, order_number')
        .single();

      if (orderError) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: orderError.message });
      }

      let orderSubtotal = 0;

      for (const item of validItems) {
        const { data: insertedItem, error: itemError } = await ctx.supabase
          .from('order_items')
          .insert({
            order_id: order.id,
            product_id: item.product!.id,
            variant_id: item.variant!.id,
            quantity: item.quantity,
            customization_text: item.customization_text,
            customization_notes: item.customization_notes,
            unit_price: 0,
            subtotal: 0,
          })
          .select('id, quantity, unit_price')
          .single();

        if (itemError) {
          await ctx.supabase.from('orders').delete().eq('id', order.id);
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: itemError.message });
        }

        const lineSubtotal = insertedItem.quantity * Number(insertedItem.unit_price);
        orderSubtotal += lineSubtotal;

        await ctx.supabase
          .from('order_items')
          .update({ subtotal: lineSubtotal })
          .eq('id', insertedItem.id);
      }

      const { error: updateOrderError } = await ctx.supabase
        .from('orders')
        .update({
          subtotal: orderSubtotal,
          total: orderSubtotal,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (updateOrderError) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: updateOrderError.message });
      }

      const { error: clearError } = await ctx.supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cartId);

      if (clearError) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: clearError.message });
      }

      return { id: order.id, order_number: order.order_number } satisfies OrderCreated;
    }),

  listMine: publicProcedure.query(async ({ ctx }): Promise<OrderListItem[]> => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Debes iniciar sesión' });
    }

    const { data, error } = await ctx.supabase
      .from('orders')
      .select(
        `
        id,
        order_number,
        status,
        payment_status,
        total,
        created_at,
        order_items(id, product_image_url, quantity)
      `
      )
      .eq('profile_id', ctx.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

    return (data ?? []).map((order) => {
      const row = order as OrderWithListItems;
      const items = row.order_items ?? [];
      const item_count = items.reduce((sum, i) => sum + i.quantity, 0);
      const preview_image = items[0]?.product_image_url ?? "";

      return {
        id: row.id,
        order_number: row.order_number,
        status: row.status as OrderStatus,
        payment_status: row.payment_status as PaymentStatus,
        total: Number(row.total),
        created_at: row.created_at,
        item_count,
        preview_image,
      } satisfies OrderListItem;
    });
  }),

  getById: publicProcedure
    .input(vOrder.getById())
    .query(async ({ ctx, input }): Promise<OrderDetail> => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Debes iniciar sesión' });
      }

      const { data: order, error } = await ctx.supabase
        .from('orders')
        .select(
          `
          id,
          order_number,
          status,
          payment_status,
          subtotal,
          total,
          created_at,
          profile_id,
          order_items(
            id,
            product_name,
            product_image_url,
            quantity,
            unit_price,
            subtotal,
            selected_options
          )
        `
        )
        .eq('id', input.id)
        .single();

      if (error || !order) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Pedido no encontrado' });
      }

      if (order.profile_id !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No tienes acceso a este pedido' });
      }

      const row = order as OrderWithItems;
      const items: OrderDetailItem[] = (row.order_items ?? []).map((item) => ({
        id: item.id,
        product_name: item.product_name,
        product_image_url: item.product_image_url,
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        subtotal: Number(item.subtotal),
        selected_options: (item.selected_options ?? {}) as Record<string, string>,
      }));

      return {
        id: row.id,
        order_number: row.order_number,
        status: row.status as OrderStatus,
        payment_status: row.payment_status as PaymentStatus,
        subtotal: Number(row.subtotal),
        total: Number(row.total),
        created_at: row.created_at,
        items,
      } satisfies OrderDetail;
    }),

  getByIdAdmin: protectedProcedure
    .input(vOrder.getByIdAdmin())
    .query(async ({ ctx, input }): Promise<OrderAdminDetail> => {
      const { data: order, error } = await ctx.supabase
        .from('orders')
        .select(
          `
          id,
          order_number,
          status,
          payment_status,
          subtotal,
          tax,
          shipping_cost,
          discount,
          total,
          created_at,
          shipping_full_name,
          shipping_phone,
          shipping_address_line1,
          shipping_address_line2,
          shipping_city,
          shipping_state,
          shipping_postal_code,
          shipping_country,
          payment_reference,
          customer_notes,
          profile:profiles(id, full_name, email, phone),
          order_items(
            id,
            product_name,
            product_image_url,
            product_sku,
            variant_sku,
            quantity,
            unit_price,
            subtotal,
            selected_options
          )
        `
        )
        .eq('id', input.id)
        .single();

      if (error || !order) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Pedido no encontrado' });
      }

      const row = order as OrderWithItems & {
        tax: number;
        shipping_cost: number;
        discount: number;
        shipping_full_name: string;
        shipping_phone: string;
        shipping_address_line1: string;
        shipping_address_line2: string;
        shipping_city: string;
        shipping_state: string;
        shipping_postal_code: string;
        shipping_country: string;
        payment_reference: string;
        customer_notes: string;
        profile: Pick<Profile, 'id' | 'full_name' | 'email' | 'phone'> | null;
        order_items: OrderItemAdminPreview[] | null;
      };

      const orderItems = (row.order_items ?? []) as OrderItemAdminPreview[];
      const items: OrderAdminDetailItem[] = orderItems.map((item) => ({
        id: item.id,
        product_name: item.product_name,
        product_image_url: item.product_image_url,
        product_sku: item.product_sku ?? '',
        variant_sku: item.variant_sku ?? '',
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        subtotal: Number(item.subtotal),
        selected_options: (item.selected_options ?? {}) as Record<string, string>,
      }));

      return {
        id: row.id,
        order_number: row.order_number,
        status: row.status as OrderStatus,
        payment_status: row.payment_status as PaymentStatus,
        subtotal: Number(row.subtotal),
        tax: Number(row.tax),
        shipping_cost: Number(row.shipping_cost),
        discount: Number(row.discount),
        total: Number(row.total),
        created_at: row.created_at,
        shipping_full_name: row.shipping_full_name,
        shipping_phone: row.shipping_phone,
        shipping_address_line1: row.shipping_address_line1,
        shipping_address_line2: row.shipping_address_line2,
        shipping_city: row.shipping_city,
        shipping_state: row.shipping_state,
        shipping_postal_code: row.shipping_postal_code,
        shipping_country: row.shipping_country,
        payment_reference: row.payment_reference,
        customer_notes: row.customer_notes,
        profile: row.profile,
        items,
      } satisfies OrderAdminDetail;
    }),

  submitPayment: protectedProcedure
    .input(vOrder.submitPayment())
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Debes iniciar sesión' });
      }

      const { data, error } = await ctx.supabase.rpc('submit_order_payment', {
        p_order_id: input.id,
        p_user_id: ctx.user.id,
        p_payment_method_id: input.payment_method_id,
        p_payment_reference: input.payment_reference.trim(),
        p_payment_date: input.payment_date,
        p_issuer_bank: input.issuer_bank,
        p_payment_proof_url: input.payment_proof_url?.trim() ?? '',
      });

      if (error) {
        const msg = error.message ?? '';

        if (msg.includes('P0001') || msg.toLowerCase().includes('no encontrado')) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Pedido no encontrado' });
        }
        if (msg.includes('P0002') || msg.toLowerCase().includes('no tienes acceso')) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'No tienes acceso a este pedido' });
        }
        if (msg.includes('P0003') || msg.toLowerCase().includes('ya no acepta')) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Este pedido ya no acepta datos de pago' });
        }
        if (msg.includes('P0004') || msg.toLowerCase().includes('método de pago')) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Método de pago no válido o inactivo' });
        }
        if (msg.includes('P0005') || msg.toLowerCase().includes('stock insuficiente')) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: msg });
        }

        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: msg });
      }

      const row = Array.isArray(data) ? data[0] : data;

      if (!row) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'No se pudo confirmar el pedido' });
      }

      return {
        id: row.id as string,
        order_number: row.order_number as string,
      } satisfies OrderCreated;
    }),
});
