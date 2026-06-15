"use client";

import { ColumnDef } from "@tanstack/react-table";
import { TableFiltersColumn } from "@/components/global/Table/Table.types";
import { Table } from "@/components/global/Table/Table";
import { formatDate } from "@/lib/formatters/date";
import { formatCurrency } from "@/lib/formatters/currency";
import { getOrderStatusLabel, getPaymentStatusLabel } from "@/lib/order-status";
import { Eye } from "lucide-react";

const EMPTY_CELL_PLACEHOLDER = "-";

const TableCellPlaceholder = () => (
  <span className="text-sm text-muted-foreground">{EMPTY_CELL_PLACEHOLDER}</span>
);

const formatCreatedAt = (createdAt?: string | null) => {
  if (!createdAt || Number.isNaN(new Date(createdAt).getTime())) return null;
  return formatDate(createdAt);
};

const statusBadgeClass = (status: OrderStatus) => {
  switch (status) {
    case "pending_payment":
      return "bg-amber-100 text-amber-800";
    case "payment_submitted":
      return "bg-orange-100 text-orange-800";
    case "payment_confirmed":
      return "bg-blue-100 text-blue-800";
    case "shipped":
      return "bg-indigo-100 text-indigo-800";
    case "delivered":
      return "bg-emerald-100 text-emerald-800";
    case "cancelled":
    case "refunded":
      return "bg-gray-100 text-gray-600";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export const columns: ColumnDef<OrderWithProfile>[] = [
  {
    accessorKey: "order_number",
    header: "Nº pedido",
    cell: ({ row }) => (
      <span className="text-sm font-mono font-medium">
        #{row.original.order_number?.trim() || "—"}
      </span>
    ),
  },
  {
    id: "customer",
    header: "Cliente",
    cell: ({ row }) => {
      const profile = row.original.profile;
      const name =
        profile?.full_name?.trim() ||
        row.original.shipping_full_name?.trim() ||
        "Sin nombre";
      const email = profile?.email?.trim();
      return (
        <div className="flex flex-col min-w-[140px]">
          <span className="text-sm font-medium">{name}</span>
          {email ? (
            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
              {email}
            </span>
          ) : (
            <TableCellPlaceholder />
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const status = row.original.status as OrderStatus;
      return (
        <span
          className={`inline-flex text-xs font-medium px-2 py-1 rounded-full ${statusBadgeClass(status)}`}
        >
          {getOrderStatusLabel(status)}
        </span>
      );
    },
  },
  {
    accessorKey: "payment_status",
    header: "Pago",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {getPaymentStatusLabel(row.original.payment_status)}
      </span>
    ),
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => (
      <span className="text-sm tabular-nums font-medium">
        {formatCurrency(row.original.total ?? 0)}
      </span>
    ),
  },
  {
    accessorKey: "shipping_phone",
    header: "Teléfono",
    cell: ({ row }) => {
      const phone =
        row.original.shipping_phone?.trim() || row.original.profile?.phone?.trim();
      if (!phone) return <TableCellPlaceholder />;
      return <span className="text-sm text-muted-foreground">{phone}</span>;
    },
  },
  {
    accessorKey: "created_at",
    header: "Fecha",
    cell: ({ row }) => {
      const label = formatCreatedAt(row.original.created_at);
      if (!label) return <TableCellPlaceholder />;
      return <span className="text-sm">{label}</span>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const { id, order_number } = row.original;
      return (
        <div className="flex justify-center">
          <Table.RowActions>
            <Table.RowActions.Link
              href={`/admin/orders/${id}`}
              title="Ver detalle"
              icon={<Eye className="h-4 w-4" />}
            />
            <Table.RowActions.CopyId entity="Pedido" id={id} />
          </Table.RowActions>
        </div>
      );
    },
  },
];

export const filterColumns: TableFiltersColumn[] = [
  { label: "status", type: "text" as const },
  { label: "payment_status", type: "text" as const },
  { label: "profile_id", type: "text" as const },
];
