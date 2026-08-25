"use client";

import { FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderSearchBarProps {
  className?: string;
}

export default function HeaderSearchBar({ className = "" }: HeaderSearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qFromUrl = pathname === "/productos" ? (searchParams.get("q") ?? "") : "";

  const [query, setQuery] = useState(qFromUrl);

  useEffect(() => {
    setQuery(qFromUrl);
  }, [qFromUrl]);

  const navigateWithQuery = (nextQuery: string) => {
    const trimmed = nextQuery.trim();

    if (pathname === "/productos") {
      const params = new URLSearchParams(searchParams.toString());
      if (trimmed) {
        params.set("q", trimmed);
      } else {
        params.delete("q");
      }
      params.set("page", "1");
      const qs = params.toString();
      router.push(qs ? `/productos?${qs}` : "/productos");
      return;
    }

    const params = new URLSearchParams();
    if (trimmed) {
      params.set("q", trimmed);
    }
    params.set("page", "1");
    const qs = params.toString();
    router.push(qs ? `/productos?${qs}` : "/productos");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigateWithQuery(query);
  };

  const handleClear = () => {
    setQuery("");
    // Solo navegar si había búsqueda activa en URL o estamos en el catálogo con q
    if (qFromUrl || (pathname === "/productos" && searchParams.has("q"))) {
      navigateWithQuery("");
    }
  };

  const showClear = query.length > 0;

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("relative min-w-0", className)}
      role="search"
      aria-label="Buscar productos"
    >
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
        aria-hidden
      />
      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar productos..."
        className={cn(
          "h-9 w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
          showClear ? "pr-9" : "pr-3"
        )}
      />
      {showClear ? (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          aria-label="Limpiar búsqueda"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
    </form>
  );
}
