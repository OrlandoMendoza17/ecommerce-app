import OrderConfirmationView from "@/components/pages/pedido/OrderConfirmationView/OrderConfirmationView";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderConfirmationPage({ params }: PageProps) {
  const { id } = await params;
  return <OrderConfirmationView orderId={id} />;
}
