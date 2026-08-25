import { Text } from "@react-email/components";
import { CtaButton, EmailLayout } from "./EmailLayout";

export type PaymentReceivedEmailProps = {
  siteName: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  adminOrderUrl: string;
};

export function PaymentReceivedEmail({
  siteName,
  orderNumber,
  customerName,
  customerEmail,
  adminOrderUrl,
}: PaymentReceivedEmailProps) {
  return (
    <EmailLayout
      siteName={siteName}
      preview={`Pago reportado — pedido #${orderNumber}`}
      heading="Pago por revisar"
    >
      <Text style={text}>
        El cliente reportó un pago para el pedido <strong>#{orderNumber}</strong>.
      </Text>
      <Text style={text}>
        Cliente: <strong>{customerName || "—"}</strong>
        <br />
        Email: <strong>{customerEmail || "—"}</strong>
      </Text>
      <CtaButton href={adminOrderUrl} label="Revisar pedido" />
    </EmailLayout>
  );
}

const text = {
  color: "#3f3f46",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 12px",
} as const;

export default PaymentReceivedEmail;
