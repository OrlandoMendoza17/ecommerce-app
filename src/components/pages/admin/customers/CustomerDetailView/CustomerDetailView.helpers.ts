import type { CustomFilter } from "@/utils/supabase/filters";

export const PAGE_SIZE = 10;
export const ADDRESSES_TO = 49;
export const EMPTY = "—";

export const byProfile = (id: string): CustomFilter[] => [
  { label: "profile_id", operator: "eq", value: id },
];

export const getPageRange = (page: number, pageSize = PAGE_SIZE) => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { from, to };
};

export const formatAddress = (address: Address): string => {
  const parts = [
    address.address_line1,
    address.address_line2,
    [address.city, address.state].filter(Boolean).join(", "),
    address.postal_code,
    address.country,
  ].filter((part) => part?.trim());
  return parts.join(" · ");
};
