import StatCard from "@/components/global/StatCard/StatCard";

interface Props {
  count: number;
  pendingCount?: number;
  href?: string;
  isLoading?: boolean;
}

const OrdersStatCard = ({
  count,
  pendingCount,
  href = "/admin/orders",
  isLoading,
}: Props) => {
  return (
    <StatCard
      label="Pedidos"
      activeCount={count}
      pendingCount={pendingCount}
      iconKey="fileCheck"
      variant="warning"
      href={href}
      isLoading={isLoading}
    />
  );
};

export default OrdersStatCard;
