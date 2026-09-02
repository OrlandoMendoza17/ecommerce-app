"use client";

import { ColumnDef } from "@tanstack/react-table";
import { TableFiltersColumn } from "@/components/global/Table/Table.types";
import { Table } from "@/components/global/Table/Table";
import { formatDate } from "@/lib/formatters/date";
import { formatDecimal, getCurrencyDisplayLabel } from "@/lib/formatters/currency";
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

const paymentStatusBadgeClass = (status: PaymentStatus) => {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-800";
    case "submitted":
      return "bg-orange-100 text-orange-800";
    case "confirmed":
      return "bg-blue-100 text-blue-800";
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
      const isGuest = !row.original.profile_id;
      const profile = row.original.profile;
      const name = isGuest
        ? row.original.guest_name?.trim() ||
          row.original.shipping_full_name?.trim() ||
          "Invitado"
        : profile?.full_name?.trim() ||
          row.original.shipping_full_name?.trim() ||
          "Sin nombre";
      const email = isGuest
        ? row.original.guest_email?.trim()
        : profile?.email?.trim();
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
  // {
  //   accessorKey: "payment_status",
  //   header: "Pago",
  //   cell: ({ row }) => {
  //     const payment_status = row.original.payment_status as PaymentStatus;
  //     return (
  //       <span
  //         className={`inline-flex text-xs font-medium px-2 py-1 rounded-full ${paymentStatusBadgeClass(payment_status)}`}
  //       >
  //         {getPaymentStatusLabel(row.original.payment_status)}
  //       </span>
  //     )
  //   },
  // },
  {
    accessorKey: "paid_total",
    header: "Total",
    cell: ({ row }) => (
      <span className="text-sm tabular-nums font-medium">
        {formatDecimal(row.original.paid_total ?? 0)}
      </span>
    ),
  },
  {
    accessorKey: "payment_currency",
    header: "Moneda",
    cell: ({ row }) => {
      const currency = row.original.payment_currency?.trim();
      if (!currency) return <TableCellPlaceholder />;
      return (
        <span className="text-sm text-muted-foreground">
          {getCurrencyDisplayLabel(currency)}
        </span>
      );
    },
  },
  {
    accessorKey: "shipping_phone",
    header: "Teléfono",
    cell: ({ row }) => {
      const phone =
        row.original.shipping_phone?.trim() ||
        row.original.guest_phone?.trim() ||
        row.original.profile?.phone?.trim();
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
  {
    label: "status",
    displayLabel: "Estado",
    type: "select",
    options: [
      { value: "pending_payment", label: getOrderStatusLabel("pending_payment") },
      { value: "payment_submitted", label: getOrderStatusLabel("payment_submitted") },
      { value: "payment_confirmed", label: getOrderStatusLabel("payment_confirmed") },
      { value: "shipped", label: getOrderStatusLabel("shipped") },
      { value: "delivered", label: getOrderStatusLabel("delivered") },
      { value: "cancelled", label: getOrderStatusLabel("cancelled") },
      { value: "refunded", label: getOrderStatusLabel("refunded") },
    ],
  },
  {
    label: "payment_status",
    displayLabel: "Estado de pago",
    type: "select",
    options: [
      { value: "pending", label: getPaymentStatusLabel("pending") },
      { value: "submitted", label: getPaymentStatusLabel("submitted") },
      { value: "confirmed", label: getPaymentStatusLabel("confirmed") },
      { value: "failed", label: getPaymentStatusLabel("failed") },
    ],
  },
  {
    label: "payment_currency",
    displayLabel: "Moneda de pago",
    type: "select",
    options: [
      { value: "USD", label: getCurrencyDisplayLabel("USD") },
      { value: "EUR", label: getCurrencyDisplayLabel("EUR") },
      { value: "VES", label: getCurrencyDisplayLabel("VES") },
    ],
  },
  {
    label: "created_at",
    displayLabel: "Fecha de creación",
    type: "date",
  },
];
