"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, SlidersHorizontal, Star } from "lucide-react";
import { trpc } from "@/config/trpc.config";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import StarRating from "@/components/shared/StarRating/StarRating";
import {
  commentsLabel,
  formatReviewDate,
  histogramPercent,
  isDefaultFilters,
  PAGE_SIZE,
  RATING_LEVELS,
  ratingsLabel,
  shouldTruncateComment,
  truncateComment,
} from "./ProductReviews.helpers";
import type { ProductReviewsProps } from "./ProductReviews.types";

const SORT_OPTIONS: { value: ReviewSort; label: string }[] = [
  { value: "recent", label: "Más recientes" },
  { value: "rating_desc", label: "Mejor calificación" },
];

export default function ProductReviews({
  productId,
  className = "",
}: ProductReviewsProps) {
  const [sort, setSort] = useState<ReviewSort>("recent");
  const [rating, setRating] = useState<ReviewRatingFilter | undefined>();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draftSort, setDraftSort] = useState<ReviewSort>("recent");
  const [draftRating, setDraftRating] = useState<ReviewRatingFilter | undefined>();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const { data: summary, isLoading: summaryLoading } =
    trpc.reviews.getProductSummary.useQuery(
      { product_id: productId },
      { enabled: !!productId }
    );

  const { data: list, isLoading: listLoading } =
    trpc.reviews.listByProduct.useQuery(
      {
        product_id: productId,
        from: 0,
        to: visibleCount - 1,
        rating,
        sort,
      },
      { enabled: !!productId }
    );

  const items = list?.items ?? [];
  const listTotal = list?.total ?? 0;
  const totalRatings = summary?.total_ratings ?? 0;
  const totalComments = summary?.total_comments ?? 0;
  const average = summary?.average_rating ?? 0;
  const hasRatings = totalRatings > 0;
  const hasMore = items.length < listTotal;

  function applyListFilters(
    nextSort: ReviewSort,
    nextRating: ReviewRatingFilter | undefined
  ) {
    setSort(nextSort);
    setRating(nextRating);
    setVisibleCount(PAGE_SIZE);
    setExpandedIds(new Set());
  }

  function openFilters() {
    setDraftSort(sort);
    setDraftRating(rating);
    setSheetOpen(true);
  }

  function resetDraft() {
    setDraftSort("recent");
    setDraftRating(undefined);
  }

  function applyDraft() {
    applyListFilters(draftSort, draftRating);
    setSheetOpen(false);
  }

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <section className={cn("ProductReviews mt-10 pt-8 border-t border-border", className)}>
      <h2 className="text-xl font-bold text-foreground mb-6">
        Opiniones del producto
      </h2>

      {summaryLoading ? (
        <div className="h-24 animate-pulse rounded-lg bg-muted" />
      ) : !hasRatings ? (
        <p className="text-sm text-muted-foreground">Aún no hay opiniones</p>
      ) : (
        <div className="grid gap-10 lg:grid-cols-[minmax(220px,1fr)_minmax(0,2fr)] lg:gap-16">
          <ReviewSummary
            average={average}
            totalRatings={totalRatings}
            counts={summary!.counts}
          />

          <div>
            <div className="mb-5 hidden justify-end gap-2 lg:flex">
              <SortDropdown
                value={sort}
                onChange={(value) => applyListFilters(value, rating)}
              />
              <RatingDropdown
                value={rating}
                onChange={(value) => applyListFilters(sort, value)}
              />
            </div>

            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-foreground">Opiniones</h3>
                <p className="hidden text-sm text-muted-foreground lg:block">
                  {commentsLabel(listTotal)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={openFilters}
                className="h-8 rounded-full bg-primary/10 px-3 text-sm font-medium text-primary hover:bg-primary/15 hover:text-primary lg:hidden"
              >
                <SlidersHorizontal className="size-4" />
                Filtrar
              </Button>
            </div>

            {listLoading && items.length === 0 ? (
              <div className="h-32 animate-pulse rounded-lg bg-muted" />
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {totalComments === 0
                  ? "Aún no hay comentarios"
                  : "No hay opiniones con este filtro"}
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {items.map((item) => (
                  <ReviewItem
                    key={item.id}
                    item={item}
                    expanded={expandedIds.has(item.id)}
                    onToggle={() => toggleExpanded(item.id)}
                  />
                ))}
              </ul>
            )}

            {hasMore && (
              <div className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-full sm:w-auto"
                  onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                >
                  Cargar más
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="rounded-t-2xl px-0"
        >
          <SheetHeader className="flex-row items-center justify-between space-y-0 px-4">
            <SheetTitle className="text-base font-bold text-foreground">
              Filtrar por:
            </SheetTitle>
            {!isDefaultFilters(draftSort, draftRating) && (
              <button
                type="button"
                onClick={resetDraft}
                className="text-sm font-medium text-primary"
              >
                Restablecer filtros
              </button>
            )}
          </SheetHeader>

          <div className="space-y-6 px-4 pb-2">
            <div>
              <p className="mb-3 text-sm font-semibold text-foreground">Ordenar</p>
              <div className="flex flex-wrap gap-2">
                {SORT_OPTIONS.map((option) => (
                  <ChoicePill
                    key={option.value}
                    selected={draftSort === option.value}
                    onClick={() => setDraftSort(option.value)}
                  >
                    {option.label}
                  </ChoicePill>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-foreground">
                Calificación
              </p>
              <div className="flex flex-wrap gap-2">
                <ChoicePill
                  selected={draftRating === undefined}
                  onClick={() => setDraftRating(undefined)}
                >
                  Todas
                </ChoicePill>
                {RATING_LEVELS.map((level) => (
                  <ChoicePill
                    key={level}
                    selected={draftRating === level}
                    onClick={() => setDraftRating(level)}
                  >
                    {level}
                    <Star className="size-3.5 fill-primary text-primary" />
                  </ChoicePill>
                ))}
              </div>
            </div>
          </div>

          <SheetFooter className="px-4">
            <Button
              type="button"
              className="h-11 w-full rounded-lg text-base"
              onClick={applyDraft}
            >
              Aplicar
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </section>
  );
}

function ReviewSummary({
  average,
  totalRatings,
  counts,
}: {
  average: number;
  totalRatings: number;
  counts: ProductReviewSummary["counts"];
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="text-5xl font-semibold leading-none text-primary">
          {average.toFixed(1)}
        </span>
        <div>
          <AverageStars value={average} />
          <p className="mt-1 text-sm text-muted-foreground">{ratingsLabel(totalRatings)}</p>
        </div>
      </div>

      <div className="mt-6 hidden lg:block">
        {RATING_LEVELS.map((level) => {
          const count = counts[level];
          const percent = histogramPercent(count, totalRatings);
          return (
            <div key={level} className="flex items-center gap-2">
              <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-muted-foreground"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="w-3 text-right text-sm text-muted-foreground">{level}</span>
              <Star className="size-3.5 text-muted-foreground" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AverageStars({ value }: { value: number }) {
  return (
    <div className="flex items-center" aria-label={`Calificación: ${value.toFixed(1)} de 5`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = Math.min(1, Math.max(0, value - (star - 1)));
        return (
          <span key={star} className="relative size-4.5">
            <Star className="absolute inset-0 size-4.5 text-muted-foreground" />
            {fill > 0 && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <Star className="size-4.5 fill-primary text-primary" />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

function SortDropdown({
  value,
  onChange,
}: {
  value: ReviewSort;
  onChange: (value: ReviewSort) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex h-8 items-center gap-1 rounded-full border px-3 text-sm outline-none",
          "border-border bg-card text-foreground",
          "data-[state=open]:border-primary data-[state=open]:bg-primary data-[state=open]:text-primary-foreground"
        )}
      >
        Ordenar
        <ChevronDown className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        {SORT_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(value === option.value && "text-primary")}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function RatingDropdown({
  value,
  onChange,
}: {
  value: ReviewRatingFilter | undefined;
  onChange: (value: ReviewRatingFilter | undefined) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex h-8 items-center gap-1 rounded-full border border-border bg-card px-3 text-sm text-foreground outline-none">
        Calificación
        <ChevronDown className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        <DropdownMenuItem
          onClick={() => onChange(undefined)}
          className={cn(value === undefined && "text-primary")}
        >
          Todas
        </DropdownMenuItem>
        {RATING_LEVELS.map((level) => (
          <DropdownMenuItem
            key={level}
            onClick={() => onChange(level)}
            className={cn(value === level && "text-primary")}
          >
            {level}
            <Star className="size-3.5 fill-current" />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ChoicePill({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm",
        selected
          ? "border-primary bg-primary/10 font-medium text-primary"
          : "border-border text-muted-foreground"
      )}
    >
      {children}
    </button>
  );
}

function ReviewItem({
  item,
  expanded,
  onToggle,
}: {
  item: ProductReviewPublicItem;
  expanded: boolean;
  onToggle: () => void;
}) {
  const comment = item.comment.trim();
  const title = item.title.trim();
  const truncatable = shouldTruncateComment(comment);
  const displayComment =
    !truncatable || expanded ? comment : truncateComment(comment);

  return (
    <li className="py-5 first:pt-0">
      <div className="flex items-center justify-between gap-3">
        <StarRating value={item.rating} readOnly size="sm" className="gap-0" />
        <time
          dateTime={item.created_at}
          className="hidden text-sm text-muted-foreground lg:block"
        >
          {formatReviewDate(item.created_at)}
        </time>
      </div>

      {title && (
        <p className="mt-2 text-sm font-semibold text-foreground">{title}</p>
      )}

      <p className="mt-2 hidden text-sm leading-relaxed text-foreground lg:block">
        {comment}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-foreground lg:hidden">
        {displayComment}
        {truncatable && (
          <>
            {" "}
            <button
              type="button"
              onClick={onToggle}
              className="font-medium text-primary"
            >
              {expanded ? "Leer menos" : "Leer más"}
            </button>
          </>
        )}
      </p>

      <time
        dateTime={item.created_at}
        className="mt-3 block text-sm text-muted-foreground lg:hidden"
      >
        {formatReviewDate(item.created_at)}
      </time>
    </li>
  );
}
