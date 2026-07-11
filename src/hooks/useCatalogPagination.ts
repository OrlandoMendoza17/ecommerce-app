"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export interface CatalogPaginationValues {
  count: number;
  page: number;
  size: number;
  from: number;
  to: number;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
}

function getFromTo(page: number, size: number) {
  const realPage = page - 1;
  const from = realPage * size;
  const to = from + size - 1;
  return { from, to };
}

export function useCatalogPagination(
  count: number | undefined,
  defaultSize = 48
): CatalogPaginationValues | undefined {
  const [shouldUpdateURL, setShouldUpdateURL] = useState(false);
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const size = (() => {
    const parsed = parseInt(params.get("size") ?? `${defaultSize}`, 10);
    if (parsed < 1) return defaultSize;
    return parsed;
  })();

  const totalPages = Math.max(Math.ceil((count ?? Infinity) / size), 1);

  const page = useMemo(() => {
    const parsed = parseInt(params.get("page") ?? "1", 10);
    if (parsed > totalPages) setShouldUpdateURL(true);
    if (parsed > totalPages) return totalPages;
    if (parsed < 1) return 1;
    return parsed;
  }, [params, totalPages]);

  const [{ from, to }, setRange] = useState(() => getFromTo(page, size));

  const onPageChange = useCallback(
    (newPage: number) => {
      const next = getFromTo(newPage, size);
      setRange(next);
      const newParams = new URLSearchParams(params);
      newParams.set("page", String(newPage));
      router.replace(`${pathname}?${newParams}`, { scroll: true });
    },
    [params, pathname, router, size]
  );

  const onSizeChange = useCallback(
    (newSize: number) => {
      const newParams = new URLSearchParams(params);
      newParams.set("size", String(newSize));
      newParams.set("page", "1");
      router.replace(`${pathname}?${newParams}`, { scroll: false });
      setRange(getFromTo(1, newSize));
    },
    [params, pathname, router]
  );

  useEffect(() => {
    if (typeof count === "undefined") return;
    setRange(getFromTo(page, size));
  }, [count, page, size]);

  useEffect(() => {
    if (!shouldUpdateURL) return;
    const newParams = new URLSearchParams(params);
    newParams.set("page", totalPages.toString());
    router.replace(`${pathname}?${newParams}`, { scroll: false });
    setShouldUpdateURL(false);
  }, [params, pathname, router, totalPages, shouldUpdateURL]);

  return useMemo(() => {
    if (typeof count === "undefined") return undefined;
    return { count, page, size, from, to, onPageChange, onSizeChange };
  }, [count, from, onPageChange, onSizeChange, page, size, to]);
}

export function resetCatalogPage(
  params: URLSearchParams,
  pathname: string,
  router: ReturnType<typeof useRouter>
) {
  const next = new URLSearchParams(params);
  next.set("page", "1");
  router.replace(`${pathname}?${next}`, { scroll: false });
}
