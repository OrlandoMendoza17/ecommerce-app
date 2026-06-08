"use client";

import FeatureHeader from "@/components/widgets/FeatureHeader/FeatureHeader";
import OrdersTable from "@/components/Tables/OrdersTable/OrdersTable";

export default function AdminOrdersPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-muted min-h-screen">
      <div className="grid grid-cols-[minmax(0,1300px)] justify-center">
        <FeatureHeader
          title="Pedidos"
          description="Consulta las órdenes realizadas por los clientes de la tienda"
        />
        <OrdersTable />
      </div>
    </div>
  );
}
