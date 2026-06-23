import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure } from '@/trpc';
import { vOrder } from '@/validations/orders.validations';
import { applyCustomFilters } from '@/utils/supabase/filters';

const orderFilters = ['status', 'payment_status', 'profile_id'] as const;

const ORDER_SEARCH_OR = (q: string) =>
  `order_number.ilike.%${q}%,shipping_full_name.ilike.%${q}%,shipping_phone.ilike.%${q}%,payment_reference.ilike.%${q}%`;

function generateOrderNumber(): string {
  const yy = String(new Date().getFullYear()).slice(-2);
  const seq = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
  return `${yy}${seq}`;
}

function mapOrderRpcError(msg: string, fallback: string): TRPCError {
  if (msg.includes('P0001') || msg.toLowerCase().includes('no encontrado') || msg.toLowerCase().includes('carrito')) {
    if (msg.toLowerCase().includes('carrito')) {
      return new TRPCError({ code: 'BAD_REQUEST', message: msg });
    }
    return new TRPCError({ code: 'NOT_FOUND', message: msg || 'Pedido no encontrado' });
  }
  if (msg.includes('P0002') || msg.toLowerCase().includes('no tienes acceso') || msg.toLowerCase().includes('no autorizado')) {
    return new TRPCError({ code: 'FORBIDDEN', message: msg || 'No autorizado' });
  }
  if (
    msg.includes('P0003') ||
    msg.includes('P0004') ||
    msg.includes('P0007') ||
    msg.toLowerCase().includes('banco emisor') ||
    msg.toLowerCase().includes('ya no acepta') ||
    msg.toLowerCase().includes('no se puede cancelar') ||
    msg.toLowerCase().includes('solo se puede confirmar') ||
    msg.toLowerCase().includes('stock insuficiente') ||
    msg.toLowerCase().includes('no se pudo reservar') ||
    msg.includes('P0005') ||
    msg.toLowerCase().includes('dirección de envío') ||
    msg.toLowerCase().includes('dirección seleccionada')
  ) {
    return new TRPCError({ code: 'BAD_REQUEST', message: msg });
  }
  return new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: msg || fallback });
}

function parseOrderRpcRow(data: unknown): { id: string; order_number: string } | null {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== 'object') return null;
  const record = row as { id?: string; order_number?: string };
  if (!record.id || !record.order_number) return null;
  return { id: record.id, order_number: record.order_number };
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

  createFromCart: publicProcedure
    .input(vOrder.createFromCart())
    .mutation(async ({ ctx, input }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Debes iniciar sesión para confirmar tu pedido',
      });
    }

    const orderNumber = generateOrderNumber();

    const { data, error } = await ctx.supabase.rpc('create_order_from_cart', {
      p_user_id: ctx.user.id,
      p_order_number: orderNumber,
    });

    if (error) {
      throw mapOrderRpcError(error.message ?? '', 'No se pudo crear el pedido');
    }

    const row = parseOrderRpcRow(data);
    if (!row) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'No se pudo crear el pedido' });
    }

    return { id: row.id, order_number: row.order_number } satisfies OrderCreated;
  }),

  setShipping: publicProcedure
    .input(vOrder.setShipping())
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Debes iniciar sesión' });
      }

      const { error } = await ctx.supabase.rpc('set_order_shipping', {
        p_order_id: input.id,
        p_user_id: ctx.user.id,
        p_mode: input.mode,
        p_address_id: input.mode === 'address' ? input.address_id : null,
      });

      if (error) {
        throw mapOrderRpcError(error.message ?? '', 'No se pudo guardar la dirección de envío');
      }
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
          payment_currency,
          payment_exchange_rate,
          paid_total,
          created_at,
          profile_id,
          shipping_delivery_mode,
          shipping_full_name,
          shipping_phone,
          shipping_address_line1,
          shipping_address_line2,
          shipping_city,
          shipping_state,
          shipping_postal_code,
          shipping_country,
          order_items(
            id,
            product_name,
            product_image_url,
            quantity,
            unit_price,
            subtotal,
            paid_unit_price,
            paid_subtotal,
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
        paid_unit_price: Number((item as any).paid_unit_price ?? 0),
        paid_subtotal: Number((item as any).paid_subtotal ?? 0),
        selected_options: (item.selected_options ?? {}) as Record<string, string>,
      }));

      return {
        id: row.id,
        order_number: row.order_number,
        status: row.status as OrderStatus,
        payment_status: row.payment_status as PaymentStatus,
        subtotal: Number(row.subtotal),
        total: Number(row.total),
        payment_currency: (row as any).payment_currency ?? 'USD',
        payment_exchange_rate: Number((row as any).payment_exchange_rate ?? 1),
        paid_total: Number((row as any).paid_total ?? 0),
        created_at: row.created_at,
        shipping_delivery_mode: ((row as any).shipping_delivery_mode ?? 'pending') as ShippingDeliveryMode,
        shipping_full_name: (row as any).shipping_full_name ?? '',
        shipping_phone: (row as any).shipping_phone ?? '',
        shipping_address_line1: (row as any).shipping_address_line1 ?? '',
        shipping_address_line2: (row as any).shipping_address_line2 ?? '',
        shipping_city: (row as any).shipping_city ?? '',
        shipping_state: (row as any).shipping_state ?? '',
        shipping_postal_code: (row as any).shipping_postal_code ?? '',
        shipping_country: (row as any).shipping_country ?? '',
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
          payment_currency,
          payment_exchange_rate,
          paid_total,
          created_at,
          shipping_full_name,
          shipping_phone,
          shipping_delivery_mode,
          shipping_address_line1,
          shipping_address_line2,
          shipping_city,
          shipping_state,
          shipping_postal_code,
          shipping_country,
          payment_reference,
          payment_proof_url,
          issuer_bank,
          payment_method:payment_methods(id, name, type),
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
            paid_unit_price,
            paid_subtotal,
            selected_options
          )
        `
        )
        .eq('id', input.id)
        .single();

      if (error || !order) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Pedido no encontrado' });
      }

      const row = order as unknown as {
        id: string;
        order_number: string;
        status: string;
        payment_status: string;
        subtotal: number;
        tax: number;
        shipping_cost: number;
        discount: number;
        total: number;
        payment_currency: string;
        payment_exchange_rate: number;
        paid_total: number;
        created_at: string;
        shipping_full_name: string;
        shipping_phone: string;
        shipping_address_line1: string;
        shipping_address_line2: string;
        shipping_city: string;
        shipping_state: string;
        shipping_postal_code: string;
        shipping_country: string;
        payment_reference: string;
        payment_proof_url: string;
        issuer_bank: string;
        payment_method: OrderPaymentMethodSummary | null;
        profile: Pick<Profile, 'id' | 'full_name' | 'email' | 'phone'> | null;
        order_items: OrderItemAdminPreview[] | null;
      };

      const paymentMethodRow = (row as { payment_method?: OrderPaymentMethodSummary | null })
        .payment_method;
      const payment_method: OrderPaymentMethodSummary | null = paymentMethodRow
        ? {
            id: paymentMethodRow.id,
            name: paymentMethodRow.name ?? '',
            type: paymentMethodRow.type,
          }
        : null;

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
        paid_unit_price: Number((item as any).paid_unit_price ?? 0),
        paid_subtotal: Number((item as any).paid_subtotal ?? 0),
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
        payment_currency: (row as any).payment_currency ?? 'USD',
        payment_exchange_rate: Number((row as any).payment_exchange_rate ?? 1),
        paid_total: Number((row as any).paid_total ?? 0),
        created_at: row.created_at,
        shipping_delivery_mode: ((row as any).shipping_delivery_mode ?? 'pending') as ShippingDeliveryMode,
        shipping_full_name: row.shipping_full_name,
        shipping_phone: row.shipping_phone,
        shipping_address_line1: row.shipping_address_line1,
        shipping_address_line2: row.shipping_address_line2,
        shipping_city: row.shipping_city,
        shipping_state: row.shipping_state,
        shipping_postal_code: row.shipping_postal_code,
        shipping_country: row.shipping_country,
        payment_reference: row.payment_reference,
        payment_proof_url: row.payment_proof_url,
        issuer_bank: row.issuer_bank ?? '',
        payment_method,
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
        p_issuer_bank: input.issuer_bank?.trim() ?? '',
        p_payment_proof_url: input.payment_proof_url?.trim() ?? '',
      });

      if (error) {
        throw mapOrderRpcError(error.message ?? '', 'No se pudo registrar el pago');
      }

      const row = parseOrderRpcRow(data);
      if (!row) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'No se pudo registrar el pago' });
      }

      return { id: row.id, order_number: row.order_number } satisfies OrderCreated;
    }),

  confirmPayment: protectedProcedure
    .input(vOrder.confirmPayment())
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Debes iniciar sesión' });
      }

      const { data, error } = await ctx.supabase.rpc('confirm_order_payment', {
        p_order_id: input.id,
        p_admin_user_id: ctx.user.id,
      });

      if (error) {
        throw mapOrderRpcError(error.message ?? '', 'No se pudo confirmar el pago');
      }

      const row = parseOrderRpcRow(data);
      if (!row) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'No se pudo confirmar el pago' });
      }

      return { id: row.id, order_number: row.order_number };
    }),

  cancelOrder: publicProcedure
    .input(vOrder.cancelOrder())
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Debes iniciar sesión' });
      }

      const { data, error } = await ctx.supabase.rpc('cancel_order', {
        p_order_id: input.id,
        p_actor_user_id: ctx.user.id,
      });

      if (error) {
        throw mapOrderRpcError(error.message ?? '', 'No se pudo cancelar el pedido');
      }

      const row = parseOrderRpcRow(data);
      if (!row) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'No se pudo cancelar el pedido' });
      }

      return { id: row.id, order_number: row.order_number };
    }),

  updateFulfillment: protectedProcedure
    .input(vOrder.updateFulfillment())
    .mutation(async ({ ctx, input }) => {
      const { data: order, error: fetchError } = await ctx.supabase
        .from('orders')
        .select('id, status')
        .eq('id', input.id)
        .single();

      if (fetchError || !order) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Pedido no encontrado' });
      }

      const requiredStatus = input.status === 'shipped' ? 'payment_confirmed' : 'shipped';
      if (order.status !== requiredStatus) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `El pedido debe estar en estado "${requiredStatus}" para marcarlo como "${input.status}"`,
        });
      }

      const now = new Date().toISOString();
      const updates =
        input.status === 'shipped'
          ? {
              status: 'shipped' as const,
              shipped_at: now,
              tracking_number: input.tracking_number?.trim() ?? '',
              updated_at: now,
            }
          : {
              status: 'delivered' as const,
              delivered_at: now,
              updated_at: now,
            };

      const { error } = await ctx.supabase.from('orders').update(updates).eq('id', input.id);

      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }

      return { success: true };
    }),
});
