"use client";

import { ColumnDef } from "@tanstack/react-table";
import { TableFiltersColumn } from "@/components/global/Table/Table.types";
import { Table } from "@/components/global/Table/Table";
import { trpc } from "@/config/trpc.config";
import { formatDate } from "@/lib/formatters/date";
import { getAge } from "@/lib/transformers/profile";

const EMPTY_CELL_PLACEHOLDER = "-";

const TableCellPlaceholder = () => (
  <span className="text-sm text-muted-foreground">{EMPTY_CELL_PLACEHOLDER}</span>
);

const formatDateOfBirthDisplay = (dateOfBirth?: string | null) => {
  if (!dateOfBirth?.trim()) {
    return { isPlaceholder: true, label: null, age: null as number | null };
  }
  const parsed = new Date(dateOfBirth);
  if (Number.isNaN(parsed.getTime())) {
    return { isPlaceholder: false, label: "Fecha inválida", age: null as number | null };
  }
  return {
    isPlaceholder: false,
    label: formatDate(dateOfBirth),
    age: getAge({ date_of_birth: dateOfBirth }),
  };
};

// Definir columnas de la tabla (mismas que MembersTable excepto Estado y Roles)
export const columns: ColumnDef<Profile>[] = [
  {
    accessorKey: "avatar_url",
    header: "Avatar",
    cell: ({ row }) => {
      const profile = row.original;
      return <Table.RowAvatar profile={profile} />;
    },
  },
  {
    accessorKey: "first_name",
    header: "Nombre",
    cell: ({ row }) => {
      const profile = row.original;
      return <Table.RowProfileName profile={profile} />;
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      const profile = row.original;
      return (
        <span className="text-sm text-muted-foreground">
          {profile?.email || "Sin email"}
        </span>
      );
    },
  },
  {
    accessorKey: "phone",
    header: "Teléfono",
    cell: ({ row }) => {
      const profile = row.original;
      return (
        <span className="text-sm text-muted-foreground">
          {profile?.phone?.trim() || "Sin teléfono"}
        </span>
      );
    },
  },
  {
    accessorKey: "date_of_birth",
    header: "Fecha de Nacimiento",
    cell: ({ row }) => {
      const profile = row.original;
      const { isPlaceholder, label, age } = formatDateOfBirthDisplay(
        profile?.date_of_birth,
      );

      if (isPlaceholder) {
        return <TableCellPlaceholder />;
      }

      return (
        <div className="flex flex-col">
          <span className="text-sm">{label}</span>
          {age !== null && (
            <span className="text-xs text-muted-foreground">({age} años)</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Fecha de registro",
    cell: ({ row }) => {
      const createdAt = row.original?.created_at;
      if (!createdAt || Number.isNaN(new Date(createdAt).getTime())) {
        return <TableCellPlaceholder />;
      }
      return <span className="text-sm">{formatDate(createdAt)}</span>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const profile = row.original;
      const utils = trpc.useUtils();
      const { id } = profile;
      const entity = "Perfil";
      return (
        <div className="flex justify-center">
          <Table.RowActions>
            <Table.RowActions.CopyId entity={entity} id={id} />
          </Table.RowActions>
        </div>
      );
    },
  },
];

// Definir columnas filtrables
export const filterColumns: TableFiltersColumn[] = [
  { label: "first_name", type: "text" as const },
  { label: "email", type: "text" as const },
];
