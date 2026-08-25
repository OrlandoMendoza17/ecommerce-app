import type { Metadata } from "next";
import Link from "next/link";
import LegalPageLayout from "@/components/pages/legal/LegalPageLayout/LegalPageLayout";
import { getPublicStoreSiteName } from "@/lib/store-settings.server";

export const metadata: Metadata = {
  title: "Envíos y entregas",
  description:
    "Cómo enviamos tu pedido, plazos estimados y opciones de entrega disponibles.",
};

export default async function EnviosPage() {
  const siteName = await getPublicStoreSiteName();

  return (
    <LegalPageLayout
      title="Envíos y entregas"
      description={`Todo lo que necesitas saber para recibir tu pedido de ${siteName}.`}
    >
      <p>
        En <strong>{siteName}</strong> queremos que recibas tu compra de la forma
        más conveniente para ti. Al completar el pago de tu pedido, podrás elegir
        cómo deseas recibirlo.
      </p>

      <h2>Modalidades de entrega</h2>
      <p>Ofrecemos dos opciones principales:</p>

      <h3>Envío a dirección</h3>
      <p>
        Seleccionas una de las direcciones guardadas en tu{" "}
        <Link href="/perfil">perfil</Link>. Usamos esos datos para coordinar el
        despacho con la empresa de mensajería o el transporte disponible en tu
        zona.
      </p>
      <p>
        Asegúrate de que la dirección esté completa y de incluir un teléfono de
        contacto. Si la dirección es incorrecta y el envío no puede completarse,
        podrían aplicarse costos adicionales de reenvío.
      </p>

      <h3>Coordinar con el vendedor</h3>
      <p>
        Si prefieres acordar punto de entrega, horario o método de envío
        directamente con nosotros, elige esta opción al pagar. Te contactaremos
        por WhatsApp, correo o teléfono para cerrar los detalles.
      </p>
      <p>
        Es ideal si necesitas flexibilidad, retiro en un punto acordado o si tu
        zona tiene restricciones de entrega estándar.
      </p>

      <h2>¿Cuándo se procesa el envío?</h2>
      <p>El flujo habitual es el siguiente:</p>
      <ol>
        <li>Creas el pedido y reportas tu pago.</li>
        <li>Verificamos el comprobante y confirmamos el pago.</li>
        <li>Preparamos el pedido y coordinamos el envío según la modalidad elegida.</li>
        <li>Te notificamos cuando el pedido sea despachado o esté listo para retiro.</li>
      </ol>
      <p>
        El envío <strong>no se inicia</strong> mientras el pedido esté pendiente
        de verificación de pago.
      </p>

      <h2>Plazos estimados</h2>
      <p>
        Los tiempos de entrega son orientativos y dependen de tu ubicación, la
        disponibilidad del producto y el método de transporte:
      </p>
      <ul>
        <li>
          <strong>Zonas urbanas principales:</strong> habitualmente entre 2 y 5
          días hábiles después de confirmar el pago.
        </li>
        <li>
          <strong>Otras localidades:</strong> pueden requerir de 5 a 10 días
          hábiles o más, según la cobertura del transporte.
        </li>
        <li>
          <strong>Entrega coordinada:</strong> el plazo se acuerda contigo al
          confirmar el pedido.
        </li>
      </ul>
      <p>
        Feriados, condiciones climáticas o situaciones de fuerza mayor pueden
        afectar estos plazos. Te mantendremos informado si hay demoras
        significativas.
      </p>

      <h2>Costo del envío</h2>
      <p>
        El costo de envío puede variar según el peso, el volumen del pedido y el
        destino. En algunos casos el envío se cotiza después de confirmar el
        pago; en otros, puede estar incluido o sujetarse a promociones vigentes.
      </p>
      <p>
        Si el envío tiene un costo adicional, te lo comunicaremos antes de
        despachar. Si no estás de acuerdo, podremos evaluar alternativas o la
        cancelación del pedido según el caso.
      </p>

      <h2>Seguimiento del pedido</h2>
      <p>
        Cuando el pedido sea despachado, podremos compartirte un número de guía o
        referencia de seguimiento, si el transportista lo proporciona. También
        puedes revisar el estado en{" "}
        <Link href="/mis-compras">Mis compras</Link>.
      </p>

      <h2>Recepción del pedido</h2>
      <p>Al recibir tu paquete:</p>
      <ul>
        <li>Revisa que el embalaje no esté dañado de forma evidente.</li>
        <li>Verifica que los productos coincidan con tu pedido.</li>
        <li>
          Si hay daños o faltantes, contáctanos dentro de las{" "}
          <strong>48 horas</strong> siguientes a la recepción, con fotos del
          producto y del empaque.
        </li>
      </ul>

      <h2>Devoluciones por envío</h2>
      <p>
        Si el producto llegó defectuoso, dañado o no corresponde a lo que
        compraste, escríbenos con el número de pedido y evidencia fotográfica.
        Evaluaremos cada caso para ofrecerte cambio, reenvío o reembolso según
        corresponda.
      </p>
      <p>
        Para más detalles sobre cambios y reembolsos, consulta nuestras{" "}
        <Link href="/faq">preguntas frecuentes</Link>.
      </p>

      <h2>¿Tienes dudas?</h2>
      <p>
        Estamos para ayudarte. Visita la página de <Link href="/contacto" className="font-medium text-primary hover:underline">contacto</Link>{" "}
        o revisa la sección de envíos en las{" "}
        <Link href="/faq">preguntas frecuentes</Link>.
      </p>
    </LegalPageLayout>
  );
}
