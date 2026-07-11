import OrderDetailView from "@/components/pages/pedido/OrderDetailView/OrderDetailView";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <OrderDetailView orderId={id} />;
}
