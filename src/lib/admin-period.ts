export const ADMIN_PERIODS = [
  "today",
  "last_7d",
  "last_30d",
  "last_90d",
  "this_month",
  "last_month",
  "this_year",
  "all",
] as const;

export type AdminPeriod = (typeof ADMIN_PERIODS)[number];

export const ADMIN_PERIOD_LABELS: Record<AdminPeriod, string> = {
  today: "Hoy",
  last_7d: "Últimos 7 días",
  last_30d: "Últimos 30 días",
  last_90d: "Últimos 90 días",
  this_month: "Este mes",
  last_month: "Mes pasado",
  this_year: "Este año",
  all: "Todo el tiempo",
};

export type PeriodRange = {
  from: string;
  to: string;
};

export type TableHrefFilter = {
  op: string;
  value: string;
};

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function parseAdminPeriod(raw: string | null | undefined): AdminPeriod {
  if (raw && (ADMIN_PERIODS as readonly string[]).includes(raw)) {
    return raw as AdminPeriod;
  }
  return "all";
}

/**
 * Resolves a preset to an inclusive day range (local timezone, ISO strings).
 * Returns null for `all` (no date filter).
 */
export function resolvePeriodRange(
  period: AdminPeriod,
  now: Date = new Date()
): PeriodRange | null {
  if (period === "all") return null;

  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  if (period === "today") {
    return { from: todayStart.toISOString(), to: todayEnd.toISOString() };
  }

  if (period === "last_7d") {
    const from = startOfDay(now);
    from.setDate(from.getDate() - 6);
    return { from: from.toISOString(), to: todayEnd.toISOString() };
  }

  if (period === "last_30d") {
    const from = startOfDay(now);
    from.setDate(from.getDate() - 29);
    return { from: from.toISOString(), to: todayEnd.toISOString() };
  }

  if (period === "last_90d") {
    const from = startOfDay(now);
    from.setDate(from.getDate() - 89);
    return { from: from.toISOString(), to: todayEnd.toISOString() };
  }

  if (period === "this_month") {
    const from = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
    return { from: from.toISOString(), to: todayEnd.toISOString() };
  }

  if (period === "last_month") {
    const from = startOfDay(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const to = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0));
    return { from: from.toISOString(), to: to.toISOString() };
  }

  // this_year
  const from = startOfDay(new Date(now.getFullYear(), 0, 1));
  return { from: from.toISOString(), to: todayEnd.toISOString() };
}

export function createdAtBetweenFilter(
  range: PeriodRange | null
): TableHrefFilter | undefined {
  if (!range) return undefined;
  return { op: "between", value: `${range.from}|${range.to}` };
}

/**
 * Builds a table deep-link compatible with useTableFilters / applyCustomFilters.
 * Serializes filters as `label=op:value` and forces page=1.
 */
export function buildTableHref(
  path: string,
  filters: Record<string, TableHrefFilter | undefined | null> = {}
): string {
  const params = new URLSearchParams();

  for (const [label, filter] of Object.entries(filters)) {
    if (!filter?.op || !filter.value) continue;
    params.set(label, `${filter.op}:${filter.value}`);
  }

  params.set("page", "1");
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}
