import OrderDetailView from "@/components/pages/admin/orders/OrderDetailView/OrderDetailView";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <OrderDetailView orderId={id} />;
}
