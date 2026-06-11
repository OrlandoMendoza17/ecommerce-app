import type { Tables } from "@/lib/database.types";

interface ExchangeRate extends Tables<"exchange_rates"> {
  currency: "USD" | "EUR" | "VES";
}
