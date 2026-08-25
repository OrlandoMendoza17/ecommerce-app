import { createServiceClient } from "@/utils/supabase/supabase.service";
import {
  getSupportEmail,
  getStoreEmailContext,
  notifyAdminExpiredOrders,
} from "@/lib/email/notifications";
import type { ExpiredOrderSummary } from "@/emails/ExpiredOrdersAdminEmail";

const API_KEY_HEADER = "x-api-key";

const validateApiKey = (request: Request): boolean => {
  const apiKey = request.headers.get(API_KEY_HEADER);
  const expectedKey = process.env.CRON_API_KEY;
  if (!expectedKey) return false;
  return apiKey === expectedKey;
};

export async function GET(request: Request) {
  if (!validateApiKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // expire_pending_orders is a stored procedure that expires pending orders
  const { data, error } = await supabase.rpc("expire_pending_orders", {
    p_hours: 48,
  });

  if (error) {
    console.error("[expire-orders] rpc error:", error.message);
    return Response.json({ error: "Database error", message: error.message }, { status: 500 });
  }

  const result = data as { cancelled_count: number; orders: ExpiredOrderSummary[] };
  const { cancelled_count, orders } = result;

  if (cancelled_count > 0) {
    const adminEmail = await getSupportEmail();

    if (adminEmail) {
      const { siteName } = await getStoreEmailContext();
      await notifyAdminExpiredOrders({
        toAdmin: adminEmail,
        cancelledOrders: orders,
        siteName,
      });
    } else {
      console.warn("[expire-orders] no admin email configured, skip notification");
    }
  }

  return Response.json({ cancelled_count, orders });
}
