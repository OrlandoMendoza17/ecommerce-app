import type { Metadata } from "next";
import Link from "next/link";
import LegalPageLayout from "@/components/pages/legal/LegalPageLayout/LegalPageLayout";
import { getPublicStoreSiteName } from "@/lib/store-settings.server";

export const metadata: Metadata = {
  title: "Términos y Condiciones",
  description:
    "Condiciones de uso, compra y pago de nuestra tienda en línea.",
};

export default async function TerminosPage() {
  const siteName = await getPublicStoreSiteName();

  return (
    <LegalPageLayout
      title="Términos y Condiciones"
      description={`Reglas que aplican cuando compras en ${siteName}. Léelas con calma; están escritas para que las entiendas sin complicaciones.`}
    >
      <p>
        Al usar el sitio web de <strong>{siteName}</strong> y realizar un pedido,
        aceptas estos términos. Si no estás de acuerdo con alguna parte, te
        pedimos que no completes la compra.
      </p>

      <h2>1. Quiénes somos</h2>
      <p>
        {siteName} es una tienda en línea que ofrece productos a través de este
        sitio. Los datos de contacto oficiales (correo, teléfono o WhatsApp)
        están disponibles en la página de{" "}
        <Link href="/contacto">contacto</Link>.
      </p>

      <h2>2. Cómo funciona una compra</h2>
      <ol>
        <li>Exploras el catálogo y agregas productos al carrito.</li>
        <li>Para confirmar el pedido debes tener una cuenta e iniciar sesión.</li>
        <li>
          Al confirmar, se crea un pedido en estado <em>pendiente de pago</em> y
          se reserva el stock de los productos seleccionados.
        </li>
        <li>
          Debes reportar tu pago en la página de pago del pedido, indicando método
          utilizado, referencia, fecha y, si aplica, adjuntar comprobante.
        </li>
        <li>
          Revisamos el pago manualmente. Cuando lo confirmamos, el pedido pasa a
          procesamiento y coordinamos el envío o la entrega.
        </li>
      </ol>

      <h2>3. Precios y moneda</h2>
      <p>
        Los precios de los productos se muestran en la moneda principal
        configurada en la tienda (por ejemplo, dólares estadounidenses o euros).
        También puedes ver una referencia en bolívares (Bs.) calculada con la
        tasa del día publicada en el sitio.
      </p>
      <p>
        La tasa de cambio puede variar. El monto en bolívares que debes transferir
        será el indicado al momento de reportar el pago, salvo que indiquemos lo
        contrario por escrito.
      </p>
      <p>
        Los precios incluyen impuestos solo si así se indica expresamente en la
        ficha del producto. Nos reservamos el derecho de corregir errores
        evidentes de precio antes de confirmar el pago.
      </p>

      <h2>4. Pagos</h2>
      <p>
        Aceptamos los métodos de pago activos en el sitio (por ejemplo: Pago
        Móvil, transferencia bancaria, Zelle, Zinli o Binance, según
        disponibilidad).
      </p>
      <p>
        El pedido <strong>no se considera pagado</strong> hasta que nosotros
        verifiquemos y confirmemos el abono. Un comprobante enviado no garantiza
        por sí solo la aprobación inmediata.
      </p>
      <p>
        Si no reportas el pago dentro de las <strong>48 horas</strong> siguientes
        a la creación del pedido, este puede cancelarse automáticamente y
        liberarse el stock reservado.
      </p>

      <h2>5. Envíos y entregas</h2>
      <p>
        Puedes elegir envío a una dirección guardada en tu cuenta o coordinar la
        entrega directamente con nosotros. Los plazos, costos y zonas de cobertura
        dependen de la modalidad elegida y se detallan en nuestra página de{" "}
        <Link href="/envios">envíos</Link>.
      </p>
      <p>
        Los tiempos estimados son referenciales. Factores externos (transporte,
        disponibilidad del producto, feriados, etc.) pueden afectar la fecha
        real de entrega.
      </p>

      <h2>6. Stock y disponibilidad</h2>
      <p>
        Hacemos el esfuerzo de mantener el inventario actualizado. Si un producto
        no está disponible después de tu pedido, te contactaremos para ofrecerte
        alternativas, esperar reposición o cancelar la línea afectada.
      </p>

      <h2>7. Cancelaciones y reembolsos</h2>
      <p>
        Puedes solicitar la cancelación antes de que confirmemos tu pago. Una vez
        confirmado, la cancelación y cualquier devolución se evaluarán según el
        estado del pedido y la naturaleza del producto.
      </p>
      <p>
        Los reembolsos, cuando correspondan, se realizarán por el mismo medio de
        pago utilizado o por uno acordado contigo, en un plazo razonable después
        de aprobar la solicitud.
      </p>

      <h2>8. Uso responsable del sitio</h2>
      <p>
        Te comprometes a proporcionar información veraz, no usar el sitio con
        fines fraudulentos y no intentar vulnerar la seguridad de la plataforma.
        Podemos suspender cuentas que incumplan estas reglas.
      </p>

      <h2>9. Propiedad intelectual</h2>
      <p>
        El contenido del sitio (textos, imágenes, logotipos, diseño) pertenece a{" "}
        {siteName} o a sus licenciantes. No está permitida su reproducción sin
        autorización previa.
      </p>

      <h2>10. Limitación de responsabilidad</h2>
      <p>
        En la medida permitida por la ley, no seremos responsables por daños
        indirectos o lucro cesante derivados del uso del sitio. Nuestra
        responsabilidad frente a un pedido se limita, como máximo, al monto
        efectivamente pagado por ese pedido.
      </p>

      <h2>11. Cambios a estos términos</h2>
      <p>
        Podemos actualizar estos términos en cualquier momento. La versión
        vigente estará siempre publicada en esta página. Los pedidos ya
        confirmados se regirán por los términos aceptados al momento de la
        compra, salvo que la ley exija lo contrario.
      </p>

      <h2>12. Contacto</h2>
      <p>
        Para dudas sobre estos términos, escríbenos desde la página de{" "}
        <Link href="/contacto">contacto</Link> o revisa las{" "}
        <Link href="/faq">preguntas frecuentes</Link>.
      </p>
    </LegalPageLayout>
  );
}
