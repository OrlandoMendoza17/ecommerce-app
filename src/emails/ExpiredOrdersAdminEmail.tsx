import { Link, Section, Text } from "@react-email/components";
import { CtaButton, EmailLayout } from "./EmailLayout";

export type ExpiredOrderItem = {
  product_name: string;
  options_label: string;
  quantity: number;
};

export type ExpiredOrderSummary = {
  id: string;
  order_number: string;
  items: ExpiredOrderItem[];
};

export type ExpiredOrdersAdminEmailProps = {
  siteName: string;
  cancelledOrders: ExpiredOrderSummary[];
  adminOrdersUrl: string;
};

export function ExpiredOrdersAdminEmail({
  siteName,
  cancelledOrders,
  adminOrdersUrl,
}: ExpiredOrdersAdminEmailProps) {
  const count = cancelledOrders.length;

  return (
    <EmailLayout
      siteName={siteName}
      preview={`${count} pedido${count !== 1 ? "s" : ""} cancelado${count !== 1 ? "s" : ""} por falta de pago`}
      heading="Pedidos expirados cancelados"
    >
      <Text style={text}>
        Se cancelaron <strong>{count}</strong> pedido{count !== 1 ? "s" : ""} por no
        haber reportado el pago dentro del plazo establecido. Se liberó el stock reservado de
        los siguientes productos:
      </Text>

      {cancelledOrders.map((order) => (
        <Section key={order.id} style={orderSection}>
          <Text style={orderHeading}>
            <Link href={`${adminOrdersUrl}/${order.id}`} style={orderLink}>
              Pedido #{order.order_number}
            </Link>
          </Text>
          {order.items.map((item, idx) => (
            <Text key={idx} style={itemRow}>
              &bull;&nbsp;
              <strong>{item.product_name}</strong>
              {item.options_label ? (
                <span style={optionsStyle}> — {item.options_label}</span>
              ) : null}
              <span style={qtyStyle}> &times; {item.quantity}</span>
            </Text>
          ))}
        </Section>
      ))}

      <CtaButton href={adminOrdersUrl} label="Ver pedidos en el admin" />
    </EmailLayout>
  );
}

const text = {
  color: "#3f3f46",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 16px",
} as const;

const orderSection = {
  borderLeft: "3px solid #e4e4e7",
  margin: "0 0 16px",
  paddingLeft: "12px",
} as const;

const orderHeading = {
  color: "#18181b",
  fontSize: "14px",
  fontWeight: 600,
  margin: "0 0 6px",
} as const;

const orderLink = {
  color: "#18181b",
  textDecoration: "underline",
} as const;

const itemRow = {
  color: "#3f3f46",
  fontSize: "13px",
  lineHeight: "1.5",
  margin: "0 0 4px",
} as const;

const optionsStyle = {
  color: "#71717a",
} as const;

const qtyStyle = {
  color: "#71717a",
  fontWeight: 600,
} as const;

export default ExpiredOrdersAdminEmail;
