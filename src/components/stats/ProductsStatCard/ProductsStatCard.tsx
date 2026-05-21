import StatCard from "@/components/global/StatCard/StatCard";

const ProductsStatCard = () => {
  return (
    <StatCard
      label="Productos"
      activeCount={156}
      iconKey="barChart"
      variant="default"
      href="/admin/products"
    />
  );
};

export default ProductsStatCard;
