import StatCard from "@/components/global/StatCard/StatCard";

interface Props {
  count: number;
  href?: string;
  isLoading?: boolean;
}

const ProductsStatCard = ({ count, href = "/admin/products", isLoading }: Props) => {
  return (
    <StatCard
      label="Productos"
      activeCount={count}
      iconKey="barChart"
      variant="default"
      href={href}
      isLoading={isLoading}
    />
  );
};

export default ProductsStatCard;
