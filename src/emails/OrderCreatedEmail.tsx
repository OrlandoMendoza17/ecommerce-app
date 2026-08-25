import { Text } from "@react-email/components";
import { CtaButton, EmailLayout } from "./EmailLayout";

export type OrderCreatedEmailProps = {
  siteName: string;
  orderNumber: string;
  totalLabel?: string;
  orderPaymentUrl: string;
};

export function OrderCreatedEmail(props: OrderCreatedEmailProps) {
  const { siteName, orderNumber, totalLabel, orderPaymentUrl } = props;
  return (
    <EmailLayout
      siteName={siteName}
      preview={`Pedido #${orderNumber} creado — completa el pago`}
      heading="Pedido creado"
    >
      <Text style={text}>
        Recibimos tu pedido <strong>#{orderNumber}</strong>. Completa el pago para
        que podamos procesarlo.
      </Text>
      {totalLabel ? (
        <Text style={text}>
          Total: <strong>{totalLabel}</strong>
        </Text>
      ) : null}
      <CtaButton href={orderPaymentUrl} label="Ir a pagar" />
    </EmailLayout>
  );
}

const text = {
  color: "#3f3f46",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 12px",
} as const;

export default OrderCreatedEmail;
