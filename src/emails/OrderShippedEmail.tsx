import { Text } from "@react-email/components";
import { CtaButton, EmailLayout } from "./EmailLayout";

export type OrderShippedEmailProps = {
  siteName: string;
  orderNumber: string;
  trackingNumber?: string;
  orderUrl: string;
};

export function OrderShippedEmail(props: OrderShippedEmailProps) {
  const { siteName, orderNumber, trackingNumber, orderUrl } = props;
  return (
    <EmailLayout
      siteName={siteName}
      preview={`Pedido #${orderNumber} enviado`}
      heading="Pedido enviado"
    >
      <Text style={text}>
        Tu pedido <strong>#{orderNumber}</strong> ya está en camino.
      </Text>
      {trackingNumber ? (
        <Text style={text}>
          Número de seguimiento: <strong>{trackingNumber}</strong>
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

export default OrderShippedEmail;
