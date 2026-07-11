import StatCard from "@/components/global/StatCard/StatCard";

interface Props {
  count: number;
  pendingCount?: number;
  isLoading?: boolean;
}

const OrdersStatCard = ({ count, pendingCount, isLoading }: Props) => {
  return (
    <StatCard
      label="Pedidos"
      activeCount={count}
      pendingCount={pendingCount}
      iconKey="fileCheck"
      variant="warning"
      href="/admin/orders"
      isLoading={isLoading}
    />
  );
};

export default OrdersStatCard;
