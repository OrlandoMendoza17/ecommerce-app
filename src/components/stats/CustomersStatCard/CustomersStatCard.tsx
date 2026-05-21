import StatCard from "@/components/global/StatCard/StatCard";

const CustomersStatCard = () => {
  return (
    <StatCard
      label="Clientes"
      activeCount={1284}
      iconKey="users"
      variant="default"
      href="/admin/customers"
    />
  );
};

export default CustomersStatCard;
