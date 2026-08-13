"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TableFiltersColumn } from "@/components/global/Table/Table.types";
import { Table } from "@/components/global/Table/Table";
import { formatDate } from "@/lib/formatters/date";
import { Tag } from "lucide-react";
import { trpc } from "@/config/trpc.config";
import { FaXmark } from "react-icons/fa6";
import { Separator } from "@/components/ui/separator";

const EMPTY_CELL_PLACEHOLDER = "-";

const TableCellPlaceholder = () => (
  <span className="text-sm text-muted-foreground">{EMPTY_CELL_PLACEHOLDER}</span>
);

const formatCreatedAt = (createdAt?: string | null) => {
  if (!createdAt || Number.isNaN(new Date(createdAt).getTime())) {
    return null;
  }
  return formatDate(createdAt);
};

export const columns: ColumnDef<Brand>[] = [
  {
    accessorKey: "image_url",
    header: "Imagen",
    cell: ({ row }) => {
      const brand = row.original;
      const name = brand?.name?.trim() || "Marca";
      return (
        <div className="flex items-center justify-center">
          <Avatar className="size-10">
            <AvatarImage
              className="object-contain"
              src={brand?.image_url || undefined}
              alt={name}
            />
            <AvatarFallback>
              <Tag className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
        </div>
      );
    },
  },
  {
    accessorKey: "name",
    header: "Nombre",
    cell: ({ row }) => {
      const brand = row.original;
      const name = brand?.name?.trim() || "Sin nombre";
      return (
        <Link
          href={`/admin/brands/update/${brand.id}`}
          className="text-sm font-medium hover:underline"
          title="Editar marca"
        >
          {name}
        </Link>
      );
    },
  },
  {
    accessorKey: "display_order",
    header: "Orden",
    cell: ({ row }) => (
      <span className="text-sm tabular-nums">
        {row.original?.display_order ?? 0}
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
          {isActive ? "Activa" : "Inactiva"}
        </span>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Fecha de registro",
    cell: ({ row }) => {
      const label = formatCreatedAt(row.original?.created_at);
      if (!label) {
        return <TableCellPlaceholder />;
      }
      return <span className="text-sm">{label}</span>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const brand = row.original;
      const { id, name } = brand;
      const entity = "Marca";
      const utils = trpc.useUtils();
      return (
        <div className="flex justify-center">
          <Table.RowActions>
            <Table.RowActions.Edit
              href={`/admin/brands/update/${id}`}
              title="Editar marca"
            />
            <Table.RowActions.CopyId entity={entity} id={id} />
            <Separator />
            <Table.RowActions.Delete
              id={id}
              name={name}
              entity={entity}
              title="Eliminar Marca"
              Icon={FaXmark}
              mutation={trpc.brands.delete}
              onDeleteSuccess={utils.brands.invalidate}
            />
          </Table.RowActions>
        </div>
      );
    },
  },
];

export const filterColumns: TableFiltersColumn[] = [
  {
    label: "is_active",
    displayLabel: "Estado",
    type: "select",
    options: [
      { value: "true", label: "Activa" },
      { value: "false", label: "Inactiva" },
    ],
  },
  {
    label: "created_at",
    displayLabel: "Fecha de registro",
    type: "date",
  },
];
