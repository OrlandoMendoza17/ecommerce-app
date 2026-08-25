import StatCard from "@/components/global/StatCard/StatCard";

interface Props {
  count: number;
  href?: string;
  isLoading?: boolean;
}

const CustomersStatCard = ({ count, href = "/admin/customers", isLoading }: Props) => {
  return (
    <StatCard
      label="Clientes"
      activeCount={count}
      iconKey="users"
      variant="default"
      href={href}
      isLoading={isLoading}
    />
  );
};

export default CustomersStatCard;
