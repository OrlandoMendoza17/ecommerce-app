import type { Metadata } from "next";
import Link from "next/link";
import FaqAccordion from "@/components/pages/legal/FaqAccordion/FaqAccordion";
import type { FaqItem } from "@/components/pages/legal/FaqAccordion/FaqAccordion";
import LegalPageLayout from "@/components/pages/legal/LegalPageLayout/LegalPageLayout";
import { getPublicStoreSiteName } from "@/lib/store-settings.server";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description:
    "Respuestas claras sobre compras, pagos, envíos y tu cuenta en nuestra tienda.",
};

function buildFaqSections(siteName: string): { title: string; items: FaqItem[] }[] {
  return [
    {
      title: "Compras y pedidos",
      items: [
        {
          question: "¿Necesito una cuenta para comprar?",
          answer:
            "Sí. Para confirmar un pedido debes iniciar sesión o crear una cuenta. Así podemos asociar tu compra, guardar tus direcciones y mostrarte el historial en Mis compras.",
        },
        {
          question: "¿Cómo sé que mi pedido se registró correctamente?",
          answer:
            "Al confirmar el carrito se crea un pedido con un número único. Serás redirigido a la página de pago, donde podrás reportar tu transferencia. También verás el pedido en Mis compras.",
        },
        {
          question: "¿Puedo modificar o cancelar un pedido?",
          answer:
            "Si aún no hemos confirmado tu pago, contáctanos lo antes posible para cancelar o ajustar el pedido. Una vez confirmado el pago, los cambios dependen del estado del despacho.",
        },
        {
          question: "¿Qué pasa si no pago a tiempo?",
          answer:
            "Si no reportas el pago dentro de las 48 horas posteriores a crear el pedido, este puede cancelarse automáticamente y liberarse el stock que habíamos reservado para ti.",
        },
      ],
    },
    {
      title: "Pagos",
      items: [
        {
          question: "¿Qué métodos de pago aceptan?",
          answer:
            "Los métodos disponibles se muestran al pagar tu pedido. Suelen incluir Pago Móvil, transferencia bancaria, Zelle, Zinli y Binance, según lo que tengamos activo en ese momento.",
        },
        {
          question: "¿Por qué mi pago no se confirma de inmediato?",
          answer: `${siteName} verifica los pagos manualmente. Cuando reportas tu transferencia, revisamos la referencia y el comprobante. Este proceso puede tomar algunas horas en días hábiles.`,
        },
        {
          question: "¿En qué moneda debo pagar?",
          answer:
            "Depende del método elegido. Algunos métodos se pagan en bolívares (Bs.) y otros en dólares u otra moneda indicada en pantalla. Siempre verás el monto exacto en la página de pago antes de transferir.",
        },
        {
          question: "¿Qué es la tasa del día que aparece en el sitio?",
          answer:
            "Es la referencia que usamos para mostrar el equivalente en bolívares de los precios en la moneda principal de la tienda. La tasa se actualiza periódicamente y el monto en Bs. al pagar será el indicado al reportar tu pago.",
        },
        {
          question: "¿Qué datos debo enviar al reportar el pago?",
          answer:
            "Método utilizado, código de referencia, fecha del pago y, si lo tienes, una captura o comprobante. Si pagaste con Pago Móvil, también indica el banco emisor.",
        },
      ],
    },
    {
      title: "Envíos y entregas",
      items: [
        {
          question: "¿Cuáles son las opciones de envío?",
          answer:
            "Puedes enviar a una dirección guardada en tu perfil o coordinar la entrega directamente con nosotros. Eliges la opción al completar el pago del pedido.",
        },
        {
          question: "¿Cuánto tarda en llegar mi pedido?",
          answer:
            "Los plazos son estimados y dependen de tu zona y del transporte disponible. En zonas urbanas suele ser de 2 a 5 días hábiles después de confirmar el pago. Consulta más detalle en la página de envíos.",
        },
        {
          question: "¿El envío tiene costo adicional?",
          answer:
            "Puede variar según destino, peso y promociones vigentes. Si aplica un costo, te lo comunicaremos antes de despachar.",
        },
        {
          question: "¿Cómo agrego o cambio mi dirección?",
          answer:
            "Desde Mi perfil puedes crear, editar o marcar una dirección como predeterminada. Te recomendamos tener al menos una dirección lista antes de pagar.",
        },
      ],
    },
    {
      title: "Cuenta y seguridad",
      items: [
        {
          question: "Olvidé mi contraseña, ¿qué hago?",
          answer:
            "En la página de inicio de sesión usa la opción de recuperar contraseña. Recibirás un correo con instrucciones para restablecerla.",
        },
        {
          question: "¿Puedo comprar sin iniciar sesión?",
          answer:
            "Puedes navegar y agregar productos al carrito como invitado, pero para confirmar el pedido necesitas una cuenta. Al iniciar sesión, los productos de tu carrito de invitado se fusionan con tu cuenta.",
        },
        {
          question: "¿Cómo protegen mis datos?",
          answer:
            "Usamos proveedores seguros para autenticación y almacenamiento. Solo recopilamos la información necesaria para procesar tus pedidos. Lee nuestra política de privacidad para más detalle.",
        },
      ],
    },
    {
      title: "Productos y stock",
      items: [
        {
          question: "¿Los productos tienen garantía?",
          answer:
            "La garantía depende de cada producto y del fabricante. Si necesitas información específica, pregúntanos antes de comprar o revisa la descripción del artículo.",
        },
        {
          question: "¿Qué pasa si un producto está agotado?",
          answer:
            "No podrás agregarlo al carrito si no hay stock. Si se agota después de tu pedido, te contactaremos para ofrecerte alternativas o un reembolso de esa línea.",
        },
        {
          question: "¿Puedo devolver un producto?",
          answer:
            "Si recibiste un artículo defectuoso, dañado o incorrecto, contáctanos dentro de las 48 horas con fotos y el número de pedido. Evaluaremos tu caso para ofrecer cambio o reembolso.",
        },
      ],
    },
  ];
}

export default async function FaqPage() {
  const siteName = await getPublicStoreSiteName();
  const sections = buildFaqSections(siteName);

  return (
    <LegalPageLayout
      title="Preguntas frecuentes"
      description="Respuestas rápidas a las dudas más comunes sobre comprar en nuestra tienda."
      useProse={false}
    >
      <p className="text-base leading-relaxed text-gray-700">
        ¿No encuentras lo que buscas? Escríbenos desde la página de{" "}
        <Link href="/contacto" className="font-medium text-primary hover:underline">
          contacto
        </Link>{" "}
        y con gusto te ayudamos.
      </p>

      <div className="mt-10 space-y-10">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              {section.title}
            </h2>
            <FaqAccordion items={section.items} />
          </section>
        ))}
      </div>

      <div className="mt-12 rounded-lg border border-gray-200 bg-gray-50 p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Documentos relacionados
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-gray-700">
          <li>
            <Link href="/terminos" className="text-primary hover:underline">
              Términos y condiciones
            </Link>
          </li>
          <li>
            <Link href="/privacidad" className="text-primary hover:underline">
              Política de privacidad
            </Link>
          </li>
          <li>
            <Link href="/envios" className="text-primary hover:underline">
              Envíos y entregas
            </Link>
          </li>
        </ul>
      </div>
    </LegalPageLayout>
  );
}
