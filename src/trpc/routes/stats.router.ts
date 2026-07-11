import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '@/trpc';

export const statsRouter = router({
  adminDashboard: protectedProcedure.query(async ({ ctx }) => {
    const [customers, products, allOrders, pendingOrders, revenue] =
      await Promise.all([
        ctx.supabase
          .from('profiles')
          .select('id', { count: 'estimated', head: true })
          .is('deleted_at', null),

        ctx.supabase
          .from('products')
          .select('id', { count: 'estimated', head: true }),

        ctx.supabase
          .from('orders')
          .select('id', { count: 'estimated', head: true }),

        ctx.supabase
          .from('orders')
          .select('id', { count: 'estimated', head: true })
          .in('status', ['pending_payment', 'payment_submitted']),

        ctx.supabase
          .from('orders')
          .select('payment_currency, paid_total')
          .eq('payment_status', 'confirmed'),
      ]);

    if (customers.error)
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: customers.error.message });
    if (products.error)
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: products.error.message });
    if (allOrders.error)
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: allOrders.error.message });
    if (pendingOrders.error)
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: pendingOrders.error.message });
    if (revenue.error)
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: revenue.error.message });

    const revenueByType = (revenue.data ?? []).reduce<
      Record<string, { total: number; orderCount: number }>
    >((acc, row) => {
      const currency = (row.payment_currency ?? 'USD').toUpperCase();
      if (!acc[currency]) acc[currency] = { total: 0, orderCount: 0 };
      acc[currency].total += Number(row.paid_total ?? 0);
      acc[currency].orderCount += 1;
      return acc;
    }, {});

    return {
      customers: customers.count ?? 0,
      products: products.count ?? 0,
      orders: allOrders.count ?? 0,
      ordersPending: pendingOrders.count ?? 0,
      revenueByType,
    };
  }),
});
