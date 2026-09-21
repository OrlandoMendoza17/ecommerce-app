"use client";

import * as React from "react";
import { ColumnDef, Table, Row } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";

export function TableRowSelectionHeader<TData>({ table }: { table: Table<TData> }) {
  return (
    <div className="flex items-center justify-center px-1">
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Seleccionar todos en esta página"
        className="translate-y-[1px]"
      />
    </div>
  );
}

export function TableRowSelectionCell<TData>({ row }: { row: Row<TData> }) {
  return (
    <div className="flex items-center justify-center px-1">
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Seleccionar fila"
        className="translate-y-[1px]"
      />
    </div>
  );
}

export function getRowSelectionColumn<TData>(): ColumnDef<TData> {
  return {
    id: "select",
    header: ({ table }) => <TableRowSelectionHeader table={table} />,
    cell: ({ row }) => <TableRowSelectionCell row={row} />,
    enableSorting: false,
    enableHiding: false,
  };
}

export const TableRowSelection = {
  Header: TableRowSelectionHeader,
  Cell: TableRowSelectionCell,
  getColumn: getRowSelectionColumn,
};

export default TableRowSelection;
