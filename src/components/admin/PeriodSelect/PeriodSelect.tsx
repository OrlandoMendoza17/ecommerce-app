"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ADMIN_PERIOD_LABELS,
  ADMIN_PERIODS,
  parseAdminPeriod,
  type AdminPeriod,
} from "@/lib/admin-period";

export default function PeriodSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const period = parseAdminPeriod(searchParams.get("period"));

  const onPeriodChange = useCallback(
    (value: string) => {
      const next = parseAdminPeriod(value);
      const params = new URLSearchParams(searchParams.toString());
      if (next === "all") {
        params.delete("period");
      } else {
        params.set("period", next);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  return (
    <Select value={period} onValueChange={onPeriodChange}>
      <SelectTrigger size="sm" className="min-w-[11rem] bg-background" aria-label="Periodo">
        <SelectValue placeholder="Periodo" />
      </SelectTrigger>
      <SelectContent align="end">
        {ADMIN_PERIODS.map((value: AdminPeriod) => (
          <SelectItem key={value} value={value}>
            {ADMIN_PERIOD_LABELS[value]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
