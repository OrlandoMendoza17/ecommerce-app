"use client";

import CustomersStatCard from "@/components/stats/CustomersStatCard/CustomersStatCard";
import ProductsStatCard from "@/components/stats/ProductsStatCard/ProductsStatCard";
import OrdersStatCard from "@/components/stats/OrdersStatCard/OrdersStatCard";
import RevenueStatCard from "@/components/stats/RevenueStatCard/RevenueStatCard";

const QuickStatsGrid = () => {
  return (
    <div className="grid gap-2 md:gap-4 grid-cols-2 lg:grid-cols-4">
      <CustomersStatCard />
      <ProductsStatCard />
      <OrdersStatCard />
      <RevenueStatCard />
    </div>
  );
};

export default QuickStatsGrid;
