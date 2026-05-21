import StatCard from "@/components/global/StatCard/StatCard";

const OrdersStatCard = () => {
  return (
    <StatCard
      label="Pedidos"
      activeCount={48}
      pendingCount={12}
      iconKey="fileCheck"
      variant="warning"
      href="/admin/orders"
    />
  );
};

export default OrdersStatCard;
