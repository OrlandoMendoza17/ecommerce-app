export type EmailType =
  | "order_created"
  | "payment_received"
  | "payment_confirmed"
  | "order_shipped"
  | "order_cancelled"
  | "contact_message"
  | "orders_expired_admin";

export type SendEmailResult =
  | { skipped: true; reason: string }
  | { skipped?: false; data: { id: string } | null; error: unknown };
