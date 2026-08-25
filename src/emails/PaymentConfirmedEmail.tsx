import { Text } from "@react-email/components";
import { CtaButton, EmailLayout } from "./EmailLayout";

export type PaymentConfirmedEmailProps = {
  siteName: string;
  orderNumber: string;
  orderConfirmationUrl: string;
};

export function PaymentConfirmedEmail(props: PaymentConfirmedEmailProps) {
  const { siteName, orderNumber, orderConfirmationUrl } = props;
  return (
    <EmailLayout
      siteName={siteName}
      preview={`Pago confirmado — pedido #${orderNumber}`}
      heading="Pago confirmado"
    >
      <Text style={text}>
        Confirmamos el pago de tu pedido <strong>#{orderNumber}</strong>. Pronto
        comenzaremos el despacho.
      </Text>
      <CtaButton href={orderConfirmationUrl} label="Ver confirmación" />
    </EmailLayout>
  );
}

const text = {
  color: "#3f3f46",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 12px",
} as const;

export default PaymentConfirmedEmail;
