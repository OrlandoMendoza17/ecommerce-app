export { sendEmail } from "@/lib/email/send";
export type { SendEmailOptions } from "@/lib/email/send";
export type { EmailType, SendEmailResult } from "@/lib/email/types";
export {
  orderUrl,
  orderPaymentUrl,
  orderConfirmationUrl,
  adminOrderUrl,
} from "@/lib/email/urls";
export {
  getStoreEmailContext,
  getSupportEmail,
  notifyOrderCreated,
  notifyPaymentReceived,
  notifyPaymentConfirmed,
  notifyOrderShipped,
  notifyOrderCancelled,
  notifyContactMessage,
} from "@/lib/email/notifications";
