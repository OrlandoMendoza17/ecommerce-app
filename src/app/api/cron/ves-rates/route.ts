import { createServiceClient } from "@/utils/supabase/supabase.service";
import axios from "axios";

const API_KEY_HEADER = "x-api-key";
const EXCHANGERATE_API_BASE = `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_RATES_API_KEY}`;

type Currency = "USD" | "EUR";

type ExchangeRateApiResponse = {
  result?: string;
  conversion_rates?: Record<string, number>;
  "error-type"?: string;
};

const validateApiKey = (request: Request): boolean => {
  const apiKey = request.headers.get(API_KEY_HEADER);
  const expectedKey = process.env.CRON_API_KEY;

  console.log("apiKey", apiKey);
  console.log("expectedKey", expectedKey);

  if (!expectedKey) return false;
  return apiKey === expectedKey;
};

const getVESRate = async (currency: Currency): Promise<number> => {

  console.log("EXCHANGERATE_API_BASE", `${EXCHANGERATE_API_BASE}/latest/${currency}`);

  const res = await axios.get<ExchangeRateApiResponse>(
    `${EXCHANGERATE_API_BASE}/latest/${currency}`
  );
  const data = res.data;

  if (data.result !== "success" || !data.conversion_rates?.VES) {
    throw new Error(`exchangerate-api (${currency}): respuesta inválida`);
  }

  return Number(data.conversion_rates.VES);
};

export async function GET(request: Request) {
  if (!validateApiKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let USD: number;
  let EUR: number;

  try {
    [USD, EUR] = await Promise.all([getVESRate("USD"), getVESRate("EUR")]);
  } catch (err) {
    return Response.json(
      { error: "External API error", message: String(err) },
      { status: 500 }
    );
  }

  const created_at = new Date().toISOString();
  let saved = false;

  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("exchange_rates").insert({
      currency: "VES",
      USD,
      EUR,
      created_at,
    });
    saved = !error;
    if (error) console.error("[ves-rates] insert error:", error.message);
  } catch (err) {
    console.error("[ves-rates] supabase error:", err);
  }

  return Response.json({ USD, EUR, timestamp: created_at, saved });
}
