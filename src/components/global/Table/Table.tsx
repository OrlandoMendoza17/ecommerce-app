"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table as TableRoot,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableProps } from "./Table.types";
import TableSkeleton from "./Table.placeholder";
import TableFilters from "./TableFilters/TableFilters";
import TableRowActions from "./columns/TableRowActions/TableRowActions";
import TableRowAvatar from "./columns/TableRowAvatar/TableRowAvatar";
import TableRowProfileName from "./columns/TableRowProfileName/TableRowProfileName";
import TableRowCurrency from "./columns/TableRowCurrency/TableRowCurrency";
import TableRowSelection from "./columns/TableRowSelection/TableRowSelection";
import { TableBulkBar } from "./TableBulkBar/TableBulkBar";
import { TableExportDropdown } from "./TableExportDropdown/TableExportDropdown";
import { TableImportModal } from "./TableImportModal/TableImportModal";

export function Table<TData, TValue>(props: TableProps<TData, TValue>) {
  const {
    columns,
    data,
    status,
    pagination,
    filters,
    search,
    searchPlaceholder = "Search...",
    noResults,
    rowSelection,
    onRowSelectionChange,
    getRowId,
    actions,
  } = props;

  const table = useReactTable({
    data: data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: pagination
      ? Math.ceil(pagination.count! / pagination.size)
      : undefined,
    enableRowSelection: true,
    onRowSelectionChange,
    state: {
      rowSelection: rowSelection ?? {},
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getRowId: getRowId ?? ((row: any) => row.id ?? String(row)),
  });

  // Error state
  if (status === "error") {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">Error loading data</p>
        {filters && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => filters.clearFilters()}
            className="mt-2"
          >
            Clear filters
          </Button>
        )}
      </div>
    );
  }

  const totalPages = pagination
    ? Math.ceil(pagination.count! / pagination.size)
    : 0;
  const currentPage = pagination?.page ?? 1;

  // Loading state
  // if (status === "pending") {
  //   return (
  //     <div className="flex items-center justify-center py-10">
  //       <div className="text-sm text-muted-foreground">Loading...</div>
  //     </div>
  //   );
  // }

  return (
    <div className="space-y-4 mt-4 md:m-0">
      {/* Search, Filters, and Actions Toolbar */}
      {(filters || search || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: Filters & Search */}
          <div className="flex flex-1 gap-2 flex-wrap min-w-0">
            {filters && <TableFilters values={filters} />}

            {search && (
              <div className="flex-1 min-w-[180px] sm:max-w-xs">
                <Input
                  placeholder={searchPlaceholder}
                  value={search.input}
                  onChange={(e) => search.onChange(e.target.value)}
                  className="text-sm! w-full"
                />
              </div>
            )}
          </div>

          {/* Right: Actions (Export, Import, custom buttons) */}
          {actions && (
            <div className="flex items-center gap-2 justify-end shrink-0 flex-wrap sm:flex-nowrap">
              {actions}
            </div>
          )}
        </div>
      )}

      {
        status === "pending"
          ?
          <TableSkeleton columns={columns.length} rows={10} />
          :
          <>
            {/* Table */}
            <div className="bg-background rounded-md border">
              <TableRoot>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        {noResults || "No results."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </TableRoot>
            </div>

            {/* Pagination */}
            {pagination && (
              <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex flex-row items-center justify-center gap-2">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {pagination.from + 1} a{" "}
                    {Math.min(pagination.to + 1, pagination.count!)} de{" "}
                    {pagination.count} resultados
                  </div>
                  {/* Page Size Selector */}
                  <Select
                    value={String(pagination.size)}
                    onValueChange={(value) =>
                      pagination.onSizeChange(Number(value))
                    }
                  >
                    <SelectTrigger size="sm" className="h-8 bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Pagination Buttons */}
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      pagination.onPageChange(currentPage - 1, pagination.size)
                    }
                    disabled={currentPage <= 1}
                  >
                    Anterior
                  </Button>
                  <div className="text-sm">
                    Página {currentPage} de {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      pagination.onPageChange(currentPage + 1, pagination.size)
                    }
                    disabled={currentPage >= totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </>
      }

    </div>
  );
}

Table.RowActions = TableRowActions;
Table.RowAvatar = TableRowAvatar;
Table.RowProfileName = TableRowProfileName;
Table.RowCurrency = TableRowCurrency;
Table.RowSelection = TableRowSelection;
Table.BulkBar = TableBulkBar;
Table.ExportDropdown = TableExportDropdown;
Table.ImportModal = TableImportModal;