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
  } = props;

  const table = useReactTable({
    data: data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: pagination
      ? Math.ceil(pagination.count! / pagination.size)
      : undefined,
  });

  // Error state
  if (status === "error") {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">Error loading data</p>
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
      {/* Search and Filters Bar */}
      <div className="flex items-center gap-2">
        {filters && <TableFilters values={filters} />}

        {search && (
          <div className="flex-1">
            <Input
              placeholder={searchPlaceholder}
              value={search.input}
              onChange={(e) => search.onChange(e.target.value)}
              className="max-w-sm text-sm"
            />
          </div>
        )}
      </div>

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
                    <SelectTrigger size="sm" className="h-8 bg-white">
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