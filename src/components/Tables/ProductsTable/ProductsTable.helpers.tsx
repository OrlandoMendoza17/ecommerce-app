"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TableFiltersColumn } from "@/components/global/Table/Table.types";
import { Table } from "@/components/global/Table/Table";
import { formatDate } from "@/lib/formatters/date";
import { formatCurrency } from "@/lib/formatters/currency";
import { Package } from "lucide-react";
import { trpc } from "@/config/trpc.config";
import { Separator } from "@/components/ui/separator";
import { FaXmark } from "react-icons/fa6";

const EMPTY_CELL_PLACEHOLDER = "-";

const TableCellPlaceholder = () => (
  <span className="text-sm text-muted-foreground">{EMPTY_CELL_PLACEHOLDER}</span>
);

const parseProductImages = (images: Product["images"]): string[] => {
  if (!images || !Array.isArray(images)) return [];
  return images.filter((item): item is string => typeof item === "string");
};

const formatCreatedAt = (createdAt?: string | null) => {
  if (!createdAt || Number.isNaN(new Date(createdAt).getTime())) {
    return null;
  }
  return formatDate(createdAt);
};

export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "images",
    header: "Imagen",
    cell: ({ row }) => {
      const product = row.original;
      const name = product?.name?.trim() || "Producto";
      const imageUrl = parseProductImages(product?.images)[0];
      return (
        <div className="flex items-center justify-center">
          <Avatar className="h-10 w-10">
            <AvatarImage
              className="object-cover"
              src={imageUrl || undefined}
              alt={name}
            />
            <AvatarFallback>
              <Package className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
        </div>
      );
    },
  },
  {
    accessorKey: "name",
    header: "Nombre",
    cell: ({ row }) => (
      <span className="text-sm font-medium">
        {row.original?.name?.trim() || "Sin nombre"}
      </span>
    ),
  },
  {
    accessorKey: "price",
    header: "Precio",
    cell: ({ row }) => (
      <span className="text-sm tabular-nums font-medium">
        {formatCurrency(row.original?.price ?? 0)}
      </span>
    ),
  },
  {
    accessorKey: "stock_quantity",
    header: "Stock",
    cell: ({ row }) => (
      <span className="text-sm tabular-nums">
        {row.original?.stock_quantity ?? 0}
      </span>
    ),
  },
  {
    accessorKey: "is_active",
    header: "Estado",
    cell: ({ row }) => {
      const isActive = row.original?.is_active ?? false;
      return (
        <span
          className={
            isActive
              ? "text-sm font-medium text-emerald-600"
              : "text-sm text-muted-foreground"
          }
        >
          {isActive ? "Activo" : "Inactivo"}
        </span>
      );
    },
  },
  {
    accessorKey: "is_featured",
    header: "Destacado",
    cell: ({ row }) => {
      const isFeatured = row.original?.is_featured ?? false;
      return (
        <span className="text-sm text-muted-foreground">
          {isFeatured ? "Sí" : "No"}
        </span>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Fecha de registro",
    cell: ({ row }) => {
      const label = formatCreatedAt(row.original?.created_at);
      if (!label) return <TableCellPlaceholder />;
      return <span className="text-sm">{label}</span>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const product = row.original;
      const utils = trpc.useUtils()
      const { id, name } = product;
      const entity = "Producto";
      return (
        <div className="flex justify-center">
          <Table.RowActions>
            <Table.RowActions.Edit
              href={`/admin/products/update/${id}`}
              title="Editar producto"
            />
            <Table.RowActions.CopyId entity={entity} id={id} />
            <Separator />
            <Table.RowActions.Delete
              id={id}
              name={name}
              entity={entity}
              title="Eliminar Producto"
              Icon={FaXmark}
              mutation={trpc.products.delete}
              onDeleteSuccess={utils.products.invalidate}
            />
          </Table.RowActions>
        </div>
      );
    },
  },
];

export const filterColumns: TableFiltersColumn[] = [
  { label: "category_id", type: "text" as const },
  { label: "is_active", type: "boolean" as const },
  { label: "is_featured", type: "boolean" as const },
  { label: "allow_backorder", type: "boolean" as const },
];
