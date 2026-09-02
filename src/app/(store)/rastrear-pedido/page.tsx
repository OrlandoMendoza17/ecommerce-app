import OrderTrackerView from "@/components/pages/rastrear-pedido/OrderTrackerView/OrderTrackerView";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const metadata = {
  title: "Rastrear pedido",
  description: "Consulta el estado de tu pedido ingresando el número de pedido y tu correo electrónico.",
};

export default async function RastrearPedidoPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const orderNumber = typeof params.n === "string" ? params.n : undefined;

  return (
    <main className="min-h-screen bg-[#ededed] py-8">
      <OrderTrackerView initialOrderNumber={orderNumber} />
    </main>
  );
}
