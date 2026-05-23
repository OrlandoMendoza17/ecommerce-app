"use client";

import { Suspense } from "react";
import { Table } from "@/components/global/Table/Table";
import TableSkeleton from "@/components/global/Table/Table.placeholder";
import { columns, filterColumns } from "./ProfileTable.helpers";
import { useTableSearch } from "@/components/global/Table/Table.hooks";
import { useTableFilters } from "@/components/global/Table/Table.hooks";
import { useTablePagination } from "@/components/global/Table/Table.hooks";
import { getTableStatus } from "@/components/global/Table/Table.helpers";
import { trpc } from "@/config/trpc.config";

const TableFallback = () => (
  <div className="rounded-md border bg-muted/50 p-4">
    <TableSkeleton columns={7} rows={10} />
  </div>
);

function ProfilesTableInner() {
  const searchValues = useTableSearch();
  const filtersValues = useTableFilters(filterColumns, "profiles-filters");
  const filters = filtersValues.getAppliedFilters();

  const baseConfig = { filters, q: searchValues.q };
  const countQuery = trpc.profiles.count.useQuery(baseConfig);
  const count = countQuery.data ?? undefined;

  const pagination = useTablePagination(count);
  const { from = 0, to = 0 } = pagination ?? {};

  const config = { ...baseConfig, from, to };
  const options = { enabled: !!pagination };
  const query = trpc.profiles.selectByRange.useQuery(config, options);
  const { data } = query;

  const status = getTableStatus(countQuery.status, query.status);

  return (
    <Table
      columns={columns}
      data={data}
      status={status}
      pagination={pagination}
      // filters={filtersValues}
      search={searchValues}
      searchPlaceholder="Buscar por nombre, email o username..."
    />
  );
}

export default function ProfilesTable() {
  return (
    <Suspense fallback={<TableFallback />}>
      <ProfilesTableInner />
    </Suspense>
  );
}
