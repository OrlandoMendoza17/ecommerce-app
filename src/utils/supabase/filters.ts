/**
 * Tipo para los filtros personalizados
 */
export interface CustomFilter {
  label: string;
  operator: string;
  value: string;
}

/**
 * Tipo genérico para queries de Supabase que soportan filtros
 */
type SupabaseQueryBuilder = {
  filter: (column: string, operator: string, value: any) => any;
};

/**
 * Aplica filtros dinámicos a una query de Supabase
 * 
 * @param query - Query de Supabase a la que se aplicarán los filtros
 * @param customFilters - Array de filtros personalizados con {label, operator, value}
 * @param prefix - Prefijo opcional para concatenar con el label (ej: "profile." para hacer "profile.status")
 * @param includeLabels - Array de labels a incluir en el filtrado (whitelist). Si no se proporciona, se incluyen todos
 * @returns La query con los filtros aplicados
 * 
 * @example
 * // Sin prefijo ni restricciones (aplica todos los filtros)
 * query = applyCustomFilters(query, customFilters);
 * 
 * @example
 * // Con prefijo para filtrar en tabla relacionada (aplica todos)
 * query = applyCustomFilters(query, customFilters, 'profile');
 * // Aplica: profile.first_name, profile.last_name, etc.
 * 
 * @example
 * // Incluyendo solo ciertos campos con prefijo
 * query = applyCustomFilters(query, customFilters, 'profile', ['first_name', 'email']);
 * // Solo 'first_name' y 'email' se aplicarán como 'profile.first_name', 'profile.email'
 */
export function applyCustomFilters<T extends SupabaseQueryBuilder>(
  query: T,
  customFilters: CustomFilter[],
  prefix?: string,
  includeLabels?: string[]
): T {
  // Filtrar los customFilters incluyendo solo los labels de la whitelist
  const filteredFilters = includeLabels
    ? customFilters.filter(filter => includeLabels.includes(filter.label))
    : customFilters;

  // Aplicar cada filtro a la query
  let modifiedQuery = query;
  for (const filter of filteredFilters) {
    const { label, operator, value } = filter;

    // Construir el campo completo (con prefijo si existe)
    const field = prefix ? `${prefix}.${label}` : label;

    // Aplicar el filtro
    modifiedQuery = modifiedQuery.filter(field, operator, value);
  }

  return modifiedQuery;
}
