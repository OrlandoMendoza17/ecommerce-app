type BuildOrderWhatsAppMessageInput = {
  orderNumber: string;
  customerName?: string | null;
  shippingDeliveryMode?: ShippingDeliveryMode | string | null;
  shippingFullName?: string | null;
  shippingAddressLine1?: string | null;
  shippingCity?: string | null;
  shippingState?: string | null;
  shippingCountry?: string | null;
};

function buildShippingPlace(input: BuildOrderWhatsAppMessageInput): string {
  if (input.shippingDeliveryMode === "coordinate") {
    return "Coordinar con el vendedor";
  }

  if (input.shippingDeliveryMode !== "address") {
    return "";
  }

  return [
    input.shippingAddressLine1,
    input.shippingCity,
    input.shippingState,
    input.shippingCountry,
  ]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
}

/** Arma el mensaje de WhatsApp con pedido, cliente y lugar de envío. */
export function buildOrderWhatsAppMessage(
  input: BuildOrderWhatsAppMessageInput
): string {
  const orderNumber = input.orderNumber?.trim();
  const customerName =
    input.customerName?.trim() || input.shippingFullName?.trim() || "";
  const place = buildShippingPlace(input);

  const lines: string[] = [];

  if (customerName) {
    lines.push(`Hola, soy ${customerName}.`);
  } else {
    lines.push("Hola.");
  }

  if (orderNumber) {
    lines.push(
      `Acabo de realizar el pedido #${orderNumber}. Quisiera coordinar el pago y la entrega.`
    );
  } else {
    lines.push(
      "Acabo de realizar un pedido en la tienda. Quisiera coordinar el pago y la entrega."
    );
  }

  if (place) {
    lines.push(`Lugar de envío: ${place}.`);
  }

  return lines.join("\n");
}
