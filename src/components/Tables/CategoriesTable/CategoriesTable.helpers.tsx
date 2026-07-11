"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TableFiltersColumn } from "@/components/global/Table/Table.types";
import { Table } from "@/components/global/Table/Table";
import { formatDate } from "@/lib/formatters/date";
import { LayoutGrid } from "lucide-react";
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

export const columns: ColumnDef<Category>[] = [
  {
    accessorKey: "image_url",
    header: "Imagen",
    cell: ({ row }) => {
      const category = row.original;
      const name = category?.name?.trim() || "Categoría";
      return (
        <div className="flex items-center justify-center">
          <Avatar className="h-10 w-10">
            <AvatarImage
              className="object-cover"
              src={category?.image_url || undefined}
              alt={name}
            />
            <AvatarFallback>
              <LayoutGrid className="h-5 w-5" />
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
      const category = row.original;
      return (
        <span className="text-sm font-medium">
          {category?.name?.trim() || "Sin nombre"}
        </span>
      );
    },
  },
  {
    accessorKey: "slug",
    header: "Slug",
    cell: ({ row }) => {
      const category = row.original;
      return (
        <span className="text-sm text-muted-foreground font-mono">
          {category?.slug?.trim() || <TableCellPlaceholder />}
        </span>
      );
    },
  },
  {
    accessorKey: "description",
    header: "Descripción",
    cell: ({ row }) => {
      const description = row.original?.description?.trim();
      if (!description) {
        return <TableCellPlaceholder />;
      }
      return (
        <span className="text-sm text-muted-foreground line-clamp-2 max-w-[240px]">
          {description}
        </span>
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
      const category = row.original;
      const { id, name } = category;
      const entity = "Categoría";
      const utils = trpc.useUtils();
      return (
        <div className="flex justify-center">
          <Table.RowActions>
            <Table.RowActions.Edit
              href={`/admin/categories/update/${id}`}
              title="Editar categoría"
            />
            <Table.RowActions.CopyId entity={entity} id={id} />
            <Separator />
            <Table.RowActions.Delete
              id={id}
              name={name}
              entity={entity}
              title="Eliminar Categoría"
              Icon={FaXmark}
              mutation={trpc.categories.delete}
              onDeleteSuccess={utils.categories.invalidate}
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
