import { Text } from "@react-email/components";
import { CtaButton, EmailLayout } from "./EmailLayout";

export type OrderRefundedEmailProps = {
  siteName: string;
  orderNumber: string;
  reason?: string;
  orderUrl: string;
};

export function OrderRefundedEmail(props: OrderRefundedEmailProps) {
  const { siteName, orderNumber, reason, orderUrl } = props;
  return (
    <EmailLayout
      siteName={siteName}
      preview={`Pedido #${orderNumber} reembolsado`}
      heading="Pedido reembolsado"
    >
      <Text style={text}>
        Tu pedido <strong>#{orderNumber}</strong> ha sido reembolsado.
      </Text>
      {reason ? (
        <Text style={text}>
          Motivo: <strong>{reason}</strong>
        </Text>
      ) : null}
      <CtaButton href={orderUrl} label="Ver pedido" />
    </EmailLayout>
  );
}

const text = {
  color: "#3f3f46",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 12px",
} as const;

export default OrderRefundedEmail;
