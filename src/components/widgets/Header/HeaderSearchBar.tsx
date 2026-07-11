"use client";

import { FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();

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
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar productos..."
        className="h-9 w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </form>
  );
}
