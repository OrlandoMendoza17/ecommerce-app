import StatCard from "@/components/global/StatCard/StatCard";

const RevenueStatCard = () => {
  return (
    <StatCard
      label="Ingresos (€)"
      activeCount={12450}
      iconKey="dollarSign"
      variant="success"
      href="/admin/orders"
    />
  );
};

export default RevenueStatCard;
