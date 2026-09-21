import { applyCustomFilters, CustomFilter } from "@/utils/supabase/filters";

export interface BulkTarget {
  id?: string;
  ids?: string[];
  allMatching?: boolean;
  filters?: CustomFilter[];
  q?: string;
}

export interface BulkTargetConfig {
  allowedFilters?: readonly string[] | string[];
  searchFields?: readonly string[] | string[];
  idField?: string;
  prefix?: string;
}

/**
 * Helper universal para aplicar las condiciones de un objetivo masivo (BulkTarget)
 * a cualquier consulta de Supabase (delete, update, select/export).
 *
 * Funciona de manera estándar para: products, categories, brands, orders, profiles, etc.
 */
export function applyBulkTarget<T>(
  query: T,
  target: BulkTarget,
  config: BulkTargetConfig = {}
): T {
  const {
    allowedFilters,
    searchFields = ["name", "slug", "description"],
    idField = "id",
    prefix,
  } = config;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let modifiedQuery = query as any;

  if (target.id) {
    modifiedQuery = modifiedQuery.eq(idField, target.id);
  } else if (target.ids && target.ids.length > 0) {
    modifiedQuery = modifiedQuery.in(idField, target.ids);
  } else if (target.allMatching) {
    if (target.filters && target.filters.length > 0) {
      modifiedQuery = applyCustomFilters(
        modifiedQuery,
        target.filters,
        prefix,
        allowedFilters ? [...allowedFilters] : undefined
      );
    }
    if (target.q && searchFields.length > 0) {
      const orConditions = searchFields
        .map((field) => `${prefix ? `${prefix}.${field}` : field}.ilike.%${target.q}%`)
        .join(",");
      modifiedQuery = modifiedQuery.or(orConditions);
    }
  }

  return modifiedQuery as T;
}
