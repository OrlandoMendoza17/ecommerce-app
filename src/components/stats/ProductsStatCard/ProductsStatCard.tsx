import StatCard from "@/components/global/StatCard/StatCard";

interface Props {
  count: number;
  isLoading?: boolean;
}

const ProductsStatCard = ({ count, isLoading }: Props) => {
  return (
    <StatCard
      label="Productos"
      activeCount={count}
      iconKey="barChart"
      variant="default"
      href="/admin/products"
      isLoading={isLoading}
    />
  );
};

export default ProductsStatCard;
