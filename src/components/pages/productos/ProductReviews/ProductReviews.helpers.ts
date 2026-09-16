import { formatDateToNow } from "@/lib/formatters/date";

export const PAGE_SIZE = 10;
export const COMMENT_CLAMP_CHARS = 180;
export const RATING_LEVELS = [5, 4, 3, 2, 1] as const;

export function ratingsLabel(count: number) {
  return `${count} calificación${count !== 1 ? "es" : ""}`;
}

export function commentsLabel(count: number) {
  return `${count} comentario${count !== 1 ? "s" : ""}`;
}

export function histogramPercent(
  count: number,
  total: number
): number {
  if (total <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function formatReviewDate(iso: string) {
  const relative = formatDateToNow(iso);
  if (!relative) return relative;
  return relative.charAt(0).toUpperCase() + relative.slice(1);
}

export function shouldTruncateComment(comment: string) {
  return comment.trim().length > COMMENT_CLAMP_CHARS;
}

export function truncateComment(comment: string) {
  const trimmed = comment.trim();
  if (!shouldTruncateComment(trimmed)) return trimmed;
  return `${trimmed.slice(0, COMMENT_CLAMP_CHARS).trimEnd()}…`;
}

export function isDefaultFilters(
  sort: ReviewSort,
  rating: ReviewRatingFilter | undefined
) {
  return sort === "recent" && rating === undefined;
}
