import OrderPaymentView from "@/components/pages/pedido/OrderPaymentView/OrderPaymentView";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderPaymentPage({ params }: PageProps) {
  const { id } = await params;
  return <OrderPaymentView orderId={id} />;
}
