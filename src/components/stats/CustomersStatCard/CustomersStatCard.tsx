import StatCard from "@/components/global/StatCard/StatCard";

interface Props {
  count: number;
  isLoading?: boolean;
}

const CustomersStatCard = ({ count, isLoading }: Props) => {
  return (
    <StatCard
      label="Clientes"
      activeCount={count}
      iconKey="users"
      variant="default"
      href="/admin/customers"
      isLoading={isLoading}
    />
  );
};

export default CustomersStatCard;
