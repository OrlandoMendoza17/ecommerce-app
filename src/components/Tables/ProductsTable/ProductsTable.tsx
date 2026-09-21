"use client";

import { Suspense, useState } from "react";
import { Table } from "@/components/global/Table/Table";
import TableSkeleton from "@/components/global/Table/Table.placeholder";
import { columns, filterColumns } from "./ProductsTable.helpers";
import {
  useTableSearch,
  useTableFilters,
  useTablePagination,
  useTableBulkSelection,
} from "@/components/global/Table/Table.hooks";
import { getTableStatus } from "@/components/global/Table/Table.helpers";
import { trpc } from "@/config/trpc.config";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CheckCircle2,
  ChevronDown,
  DollarSign,
  FolderTree,
  Sparkles,
  Upload,
  XCircle,
} from "lucide-react";
import BulkPriceAdjustModal from "./BulkActionsBar/BulkPriceAdjustModal";
import BulkAssignModal from "./BulkActionsBar/BulkAssignModal";
import { TableExportColumn } from "@/utils/export/tableExport";
import {
  productImportTemplateColumns,
  validateProductRecordRows,
} from "@/utils/csv/productCsv";
import { CsvProductItem } from "@/validations/products.validations";

const TableFallback = () => (
  <div className="rounded-md border bg-muted/50 p-4">
    <TableSkeleton columns={10} rows={10} />
  </div>
);

// Columnas para el motor universal de exportación (CSV, XLSX, PDF)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const productExportColumns: TableExportColumn<any>[] = [
  { header: "Nombre", key: "name" },
  { header: "Slug", key: "slug" },
  {
    header: "SKU",
    key: "sku",
    formatter: (_, row) => row.product_variants?.[0]?.sku ?? "",
  },
  {
    header: "Categoría",
    key: "category",
    formatter: (_, row) => row.category?.name ?? "",
  },
  {
    header: "Marca",
    key: "brand",
    formatter: (_, row) => row.brand?.name ?? "",
  },
  {
    header: "Precio ($)",
    key: "price",
    formatter: (_, row) => row.product_variants?.[0]?.price ?? 0,
  },
  {
    header: "Precio Comparación ($)",
    key: "compare_at_price",
    formatter: (_, row) => row.product_variants?.[0]?.compare_at_price ?? 0,
  },
  {
    header: "Stock",
    key: "stock",
    formatter: (_, row) => row.product_variants?.[0]?.stock_quantity ?? 0,
  },
  {
    header: "Estado",
    key: "is_active",
    formatter: (val) => (val ? "Activo" : "Inactivo"),
  },
  {
    header: "Destacado",
    key: "is_featured",
    formatter: (val) => (val ? "Sí" : "No"),
  },
];

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

  // Hook global estandarizado para selección masiva
  const bulk = useTableBulkSelection({
    data,
    totalCount: count,
    resetTriggers: [searchValues.q, JSON.stringify(filters)],
  });

  const utils = trpc.useUtils();
  const { toast, errorToast } = useToast();

  // Estados de modales secundarios
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Mutaciones de acciones masivas
  const bulkUpdateMutation = trpc.products.bulkUpdate.useMutation({
    onError: (err) => errorToast(err),
  });

  const bulkAdjustPriceMutation = trpc.products.bulkAdjustPrice.useMutation({
    onError: (err) => errorToast(err),
  });

  const deleteMutation = trpc.products.delete.useMutation({
    onError: (err) => errorToast(err),
  });

  const bulkImportMutation = trpc.products.bulkImport.useMutation({
    onError: (err) => errorToast(err),
  });

  // Handlers de acciones masivas
  const handleUpdateStatus = async (isActive: boolean) => {
    const target = bulk.getTargetPayload(filters, searchValues.q);
    await bulkUpdateMutation.mutateAsync({
      ...target,
      data: { is_active: isActive },
    });
    toast({
      title: "Estado actualizado",
      description: `Se actualizaron ${bulk.effectiveCount} productos como ${
        isActive ? "activos" : "inactivos"
      }.`,
      variant: "success",
    });
    bulk.clearSelection();
    utils.products.invalidate();
  };

  const handleUpdateFeatured = async (isFeatured: boolean) => {
    const target = bulk.getTargetPayload(filters, searchValues.q);
    await bulkUpdateMutation.mutateAsync({
      ...target,
      data: { is_featured: isFeatured },
    });
    toast({
      title: "Destacado actualizado",
      description: `Se actualizaron ${bulk.effectiveCount} productos como ${
        isFeatured ? "destacados" : "no destacados"
      }.`,
      variant: "success",
    });
    bulk.clearSelection();
    utils.products.invalidate();
  };

  const handleAssign = async (dataPayload: {
    category_id?: string | null;
    brand_id?: string | null;
  }) => {
    const target = bulk.getTargetPayload(filters, searchValues.q);
    await bulkUpdateMutation.mutateAsync({
      ...target,
      data: dataPayload,
    });
    toast({
      title: "Asignación completada",
      description: `Se actualizaron los datos de ${bulk.effectiveCount} productos.`,
      variant: "success",
    });
    bulk.clearSelection();
    utils.products.invalidate();
  };

  const handleAdjustPrice = async (priceConfig: {
    mode: "percentage" | "fixed";
    amount: number;
    target: "price" | "compare_at_price" | "both";
    roundTo99: boolean;
  }) => {
    const target = bulk.getTargetPayload(filters, searchValues.q);
    await bulkAdjustPriceMutation.mutateAsync({
      ...target,
      ...priceConfig,
    });
    toast({
      title: "Precios ajustados",
      description: `Se modificaron los precios de ${bulk.effectiveCount} productos.`,
      variant: "success",
    });
    bulk.clearSelection();
    utils.products.invalidate();
  };

  const handleDelete = async () => {
    const target = bulk.getTargetPayload(filters, searchValues.q);
    await deleteMutation.mutateAsync(target);
    toast({
      title: "Productos eliminados",
      description: `Se eliminaron permanentemente ${bulk.effectiveCount} productos.`,
      variant: "success",
    });
    bulk.clearSelection();
    utils.products.invalidate();
  };

  // Función para obtener los datos de exportación
  const handleFetchExportData = async (scope: "current" | "all") => {
    const data = await utils.products.exportCatalog.fetch({
      all: scope === "all",
      filters: scope === "all" ? undefined : filters,
      q: scope === "all" ? undefined : searchValues.q,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []) as any[];
  };

  // Función para procesar la importación masiva
  const handleImportProducts = async (items: CsvProductItem[]) => {
    return await bulkImportMutation.mutateAsync({
      items,
      mode: "upsert",
    });
  };

  return (
    <>
      <Table
        columns={columns}
        data={data}
        status={status}
        pagination={pagination}
        filters={filtersValues}
        search={searchValues}
        searchPlaceholder="Buscar por nombre, slug o SKU..."
        rowSelection={bulk.rowSelection}
        onRowSelectionChange={bulk.onRowSelectionChange}
        getRowId={(row) => row.id}
        actions={
          <>
            <Table.ExportDropdown
              title="Catálogo de Productos"
              filenamePrefix="catalogo-productos"
              columns={productExportColumns}
              onFetchData={handleFetchExportData}
            />

            <Button
              variant="outline"
              size="sm"
              onClick={() => setImportModalOpen(true)}
              className="gap-1.5 text-xs h-9 bg-card hover:bg-muted/80"
            >
              <Upload className="size-4 text-muted-foreground" />
              <span>Importar</span>
            </Button>
          </>
        }
      />

      {/* Barra flotante universal de acciones masivas con diseño responsivo */}
      <Table.BulkBar
        selectedCount={bulk.selectedCount}
        effectiveCount={bulk.effectiveCount}
        isAllPageSelected={bulk.isAllPageSelected}
        allMatching={bulk.allMatching}
        totalCount={count}
        itemLabel="productos"
        onToggleAllMatching={bulk.toggleAllMatching}
        onClearSelection={bulk.clearSelection}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1 text-xs h-8">
              <span>Estado</span>
              <ChevronDown className="size-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center">
            <DropdownMenuItem
              onClick={() => handleUpdateStatus(true)}
              className="gap-2 text-xs cursor-pointer"
            >
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              Activar seleccionados
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleUpdateStatus(false)}
              className="gap-2 text-xs cursor-pointer"
            >
              <XCircle className="size-3.5 text-muted-foreground" />
              Desactivar seleccionados
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1 text-xs h-8">
              <Sparkles className="size-3 text-amber-500" />
              <span>Destacado</span>
              <ChevronDown className="size-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center">
            <DropdownMenuItem
              onClick={() => handleUpdateFeatured(true)}
              className="gap-2 text-xs cursor-pointer"
            >
              <Sparkles className="size-3.5 text-amber-500" />
              Marcar destacados
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleUpdateFeatured(false)}
              className="gap-2 text-xs cursor-pointer"
            >
              <XCircle className="size-3.5 text-muted-foreground" />
              Quitar destacado
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setAssignModalOpen(true)}
          className="gap-1 text-xs h-8"
        >
          <FolderTree className="size-3" />
          <span className="hidden sm:inline">Asignar</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setPriceModalOpen(true)}
          className="gap-1 text-xs h-8"
        >
          <DollarSign className="size-3" />
          <span className="hidden sm:inline">Ajustar precios</span>
        </Button>

        <Table.BulkBar.Delete
          count={bulk.effectiveCount}
          onDelete={handleDelete}
          description={`¿Estás seguro de eliminar permanentemente ${bulk.effectiveCount} productos? Esta acción eliminará sus variantes y registros asociados.`}
        />
      </Table.BulkBar>

      {/* Modales secundarios */}
      <BulkPriceAdjustModal
        open={priceModalOpen}
        onOpenChange={setPriceModalOpen}
        count={bulk.effectiveCount}
        onConfirm={handleAdjustPrice}
      />

      <BulkAssignModal
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
        count={bulk.effectiveCount}
        onAssign={handleAssign}
      />

      <Table.ImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        title="Importar Productos"
        description="Sube un archivo Excel (.xlsx) o CSV (.csv) para crear o actualizar productos del catálogo por SKU o Slug."
        filenamePrefix="productos"
        templateColumns={productImportTemplateColumns}
        parseAndValidate={validateProductRecordRows}
        onImport={handleImportProducts}
        onSuccess={() => utils.products.invalidate()}
      />
    </>
  );
}

export default function ProductsTable() {
  return (
    <Suspense fallback={<TableFallback />}>
      <ProductsTableInner />
    </Suspense>
  );
}
