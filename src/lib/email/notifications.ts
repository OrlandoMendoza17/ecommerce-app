import "server-only";

import { createClient } from "@supabase/supabase-js";
import { STORE_SETTINGS_FALLBACK } from "@/lib/store-settings";
import { sendEmail } from "@/lib/email/send";
import {
  adminOrderUrl,
  adminOrdersUrl,
  orderConfirmationUrl,
  orderPaymentUrl,
  orderUrl,
} from "@/lib/email/urls";
import { OrderCreatedEmail } from "@/emails/OrderCreatedEmail";
import { PaymentReceivedEmail } from "@/emails/PaymentReceivedEmail";
import { PaymentConfirmedEmail } from "@/emails/PaymentConfirmedEmail";
import { OrderShippedEmail } from "@/emails/OrderShippedEmail";
import { OrderCancelledEmail } from "@/emails/OrderCancelledEmail";
import { ContactMessageEmail } from "@/emails/ContactMessageEmail";
import {
  ExpiredOrdersAdminEmail,
  type ExpiredOrderSummary,
} from "@/emails/ExpiredOrdersAdminEmail";

export type StoreEmailContext = {
  siteName: string;
  supportEmail: string | null;
};

export async function getStoreEmailContext(): Promise<StoreEmailContext> {
  try {
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data } = await supabase
      .from("store_settings")
      .select("site_name, support_email")
      .limit(1)
      .maybeSingle();

    const siteName = data?.site_name?.trim() || STORE_SETTINGS_FALLBACK.site_name;
    const supportEmail = data?.support_email?.trim() || null;

    return { siteName, supportEmail };
  } catch {
    return {
      siteName: STORE_SETTINGS_FALLBACK.site_name,
      supportEmail: null,
    };
  }
}

export async function getSupportEmail(): Promise<string | null> {
  const { supportEmail } = await getStoreEmailContext();
  if (!supportEmail) {
    console.warn("[email] support_email empty, skip admin notification");
  }
  return supportEmail;
}

export async function notifyOrderCreated(opts: {
  to: string;
  orderId: string;
  orderNumber: string;
  siteName?: string;
  totalLabel?: string;
}) {
  const storeEmailContext = await getStoreEmailContext();
  const siteName = opts.siteName ?? storeEmailContext.siteName;

  return sendEmail({
    type: "order_created",
    to: opts.to,
    subject: `Pedido #${opts.orderNumber} creado`,
    tags: [
      { name: "type", value: "order_created" },
      { name: "order_id", value: opts.orderId },
    ],
    react: OrderCreatedEmail({
      siteName,
      orderNumber: opts.orderNumber,
      totalLabel: opts.totalLabel,
      orderPaymentUrl: orderPaymentUrl(opts.orderId),
    }),
  });
}

export async function notifyPaymentReceived(opts: {
  toAdmin: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  siteName?: string;
}) {
  const siteName =
    opts.siteName ?? (await getStoreEmailContext()).siteName;

  return sendEmail({
    type: "payment_received",
    to: opts.toAdmin,
    subject: `Pago reportado — pedido #${opts.orderNumber}`,
    tags: [
      { name: "type", value: "payment_received" },
      { name: "order_id", value: opts.orderId },
    ],
    react: PaymentReceivedEmail({
      siteName,
      orderNumber: opts.orderNumber,
      customerName: opts.customerName,
      customerEmail: opts.customerEmail,
      adminOrderUrl: adminOrderUrl(opts.orderId),
    }),
  });
}

export async function notifyPaymentConfirmed(opts: {
  to: string;
  orderId: string;
  orderNumber: string;
  siteName?: string;
}) {
  const siteName =
    opts.siteName ?? (await getStoreEmailContext()).siteName;

  return sendEmail({
    type: "payment_confirmed",
    to: opts.to,
    subject: `Pago confirmado — pedido #${opts.orderNumber}`,
    tags: [
      { name: "type", value: "payment_confirmed" },
      { name: "order_id", value: opts.orderId },
    ],
    react: PaymentConfirmedEmail({
      siteName,
      orderNumber: opts.orderNumber,
      orderConfirmationUrl: orderConfirmationUrl(opts.orderId),
    }),
  });
}

export async function notifyOrderShipped(opts: {
  to: string;
  orderId: string;
  orderNumber: string;
  trackingNumber?: string;
  siteName?: string;
}) {
  const siteName =
    opts.siteName ?? (await getStoreEmailContext()).siteName;

  return sendEmail({
    type: "order_shipped",
    to: opts.to,
    subject: `Pedido #${opts.orderNumber} enviado`,
    tags: [
      { name: "type", value: "order_shipped" },
      { name: "order_id", value: opts.orderId },
    ],
    react: OrderShippedEmail({
      siteName,
      orderNumber: opts.orderNumber,
      trackingNumber: opts.trackingNumber,
      orderUrl: orderUrl(opts.orderId),
    }),
  });
}

export async function notifyOrderCancelled(opts: {
  to: string;
  orderId: string;
  orderNumber: string;
  reason?: string;
  siteName?: string;
}) {
  const siteName =
    opts.siteName ?? (await getStoreEmailContext()).siteName;

  return sendEmail({
    type: "order_cancelled",
    to: opts.to,
    subject: `Pedido #${opts.orderNumber} cancelado`,
    tags: [
      { name: "type", value: "order_cancelled" },
      { name: "order_id", value: opts.orderId },
    ],
    react: OrderCancelledEmail({
      siteName,
      orderNumber: opts.orderNumber,
      reason: opts.reason,
      orderUrl: orderUrl(opts.orderId),
    }),
  });
}

export async function notifyContactMessage(opts: {
  toAdmin: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  siteName?: string;
}) {
  const siteName =
    opts.siteName ?? (await getStoreEmailContext()).siteName;

  return sendEmail({
    type: "contact_message",
    to: opts.toAdmin,
    subject: `[Contacto] ${opts.subject}`,
    tags: [{ name: "type", value: "contact_message" }],
    react: ContactMessageEmail({
      siteName,
      name: opts.name,
      email: opts.email,
      subject: opts.subject,
      message: opts.message,
    }),
  });
}

export async function notifyAdminExpiredOrders(opts: {
  toAdmin: string;
  cancelledOrders: ExpiredOrderSummary[];
  siteName?: string;
}) {
  const siteName =
    opts.siteName ?? (await getStoreEmailContext()).siteName;
  const count = opts.cancelledOrders.length;

  return sendEmail({
    type: "orders_expired_admin",
    to: opts.toAdmin,
    subject: `[Admin] ${count} pedido${count !== 1 ? "s" : ""} cancelado${count !== 1 ? "s" : ""} por falta de pago`,
    tags: [{ name: "type", value: "orders_expired_admin" }],
    react: ExpiredOrdersAdminEmail({
      siteName,
      cancelledOrders: opts.cancelledOrders,
      adminOrdersUrl: adminOrdersUrl(),
    }),
  });
}
