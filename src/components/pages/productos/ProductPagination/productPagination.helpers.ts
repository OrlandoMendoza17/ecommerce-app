const START_WINDOW = 10;
const SIBLING_COUNT = 5;
const END_WINDOW = 8;

export type PaginationItem =
  | { type: "page"; page: number }
  | { type: "ellipsis" };

export function buildPaginationItems(
  currentPage: number,
  totalPages: number
): PaginationItem[] {
  if (totalPages <= 0) return [];
  if (totalPages <= START_WINDOW) {
    return Array.from({ length: totalPages }, (_, index) => ({
      type: "page" as const,
      page: index + 1,
    }));
  }

  if (currentPage <= 6) {
    return Array.from({ length: START_WINDOW }, (_, index) => ({
      type: "page" as const,
      page: index + 1,
    }));
  }

  if (currentPage >= totalPages - SIBLING_COUNT) {
    const start = Math.max(2, totalPages - (END_WINDOW - 1));
    const items: PaginationItem[] = [{ type: "page", page: 1 }];
    if (start > 2) items.push({ type: "ellipsis" });
    for (let page = start; page <= totalPages; page++) {
      items.push({ type: "page", page });
    }
    return items;
  }

  const rangeStart = currentPage - SIBLING_COUNT;
  const rangeEnd = currentPage + SIBLING_COUNT;
  const items: PaginationItem[] = [{ type: "page", page: 1 }];

  if (rangeStart > 2) items.push({ type: "ellipsis" });

  for (let page = rangeStart; page <= rangeEnd; page++) {
    items.push({ type: "page", page });
  }

  if (rangeEnd < totalPages - 1) items.push({ type: "ellipsis" });
  items.push({ type: "page", page: totalPages });

  return items;
}
