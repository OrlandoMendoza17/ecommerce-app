"use client";

import { Suspense } from "react";
import { Table } from "@/components/global/Table/Table";
import TableSkeleton from "@/components/global/Table/Table.placeholder";
import { columns, filterColumns } from "./ProductsTable.helpers";
import { useTableSearch } from "@/components/global/Table/Table.hooks";
import { useTableFilters } from "@/components/global/Table/Table.hooks";
import { useTablePagination } from "@/components/global/Table/Table.hooks";
import { getTableStatus } from "@/components/global/Table/Table.helpers";
import { trpc } from "@/config/trpc.config";

const TableFallback = () => (
  <div className="rounded-md border bg-muted/50 p-4">
    <TableSkeleton columns={10} rows={10} />
  </div>
);

function ProductsTableInner() {
  const searchValues = useTableSearch();
  const filtersValues = useTableFilters(filterColumns, "products-filters");
  const filters = filtersValues.getAppliedFilters();

  const baseConfig = { filters, q: searchValues.q };
  const countQuery = trpc.products.count.useQuery(baseConfig);
  const count = countQuery.data ?? undefined;

  const pagination = useTablePagination(count);
  const { from = 0, to = 0 } = pagination ?? {};

  const config = { ...baseConfig, from, to };
  const options = { enabled: !!pagination };
  const query = trpc.products.selectByRange.useQuery(config, options);
  const { data } = query;

  const status = getTableStatus(countQuery.status, query.status);

  return (
    <Table
      columns={columns}
      data={data}
      status={status}
      pagination={pagination}
      search={searchValues}
      searchPlaceholder="Buscar por nombre, slug, SKU o material..."
    />
  );
}

export default function ProductsTable() {
  return (
    <Suspense fallback={<TableFallback />}>
      <ProductsTableInner />
    </Suspense>
  );
}
