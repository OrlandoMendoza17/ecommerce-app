"use client";

import { trpc } from "@/config/trpc.config";
import CustomersStatCard from "@/components/stats/CustomersStatCard/CustomersStatCard";
import ProductsStatCard from "@/components/stats/ProductsStatCard/ProductsStatCard";
import OrdersStatCard from "@/components/stats/OrdersStatCard/OrdersStatCard";
import RevenueStatCard from "@/components/stats/RevenueStatCard/RevenueStatCard";

const CURRENCY_ORDER = ["USD", "EUR", "VES"];

const QuickStatsGrid = () => {
  const { data, isLoading } = trpc.stats.adminDashboard.useQuery();

  const revenueEntries = isLoading
    ? (["USD", "EUR", "VES"] as const).map((c) => ({
        currency: c,
        total: 0,
        orderCount: 0,
      }))
    : [
        ...CURRENCY_ORDER.filter((c) => data?.revenueByType[c]),
        ...Object.keys(data?.revenueByType ?? {}).filter(
          (c) => !CURRENCY_ORDER.includes(c)
        ),
      ].map((c) => ({
        currency: c,
        total: data?.revenueByType[c]?.total ?? 0,
        orderCount: data?.revenueByType[c]?.orderCount ?? 0,
      }));

  return (
    <div className="flex flex-col gap-4">
      {/* Stats operacionales */}
      <div className="grid gap-2 md:gap-4 grid-cols-2 md:grid-cols-3">
        <CustomersStatCard count={data?.customers ?? 0} isLoading={isLoading} />
        <ProductsStatCard count={data?.products ?? 0} isLoading={isLoading} />
        <OrdersStatCard
          count={data?.orders ?? 0}
          pendingCount={data?.ordersPending}
          isLoading={isLoading}
        />
      </div>

      {/* Ingresos por moneda */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-0.5">
          Ingresos por moneda
        </p>
        <div className="grid gap-2 md:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {revenueEntries.map(({ currency, total, orderCount }) => (
            <RevenueStatCard
              key={currency}
              currency={currency}
              total={total}
              orderCount={orderCount}
              isLoading={isLoading}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickStatsGrid;
