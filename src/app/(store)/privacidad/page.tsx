import type { Metadata } from "next";
import Link from "next/link";
import LegalPageLayout from "@/components/pages/legal/LegalPageLayout/LegalPageLayout";
import { getPublicStoreSiteName } from "@/lib/store-settings.server";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description:
    "Cómo recopilamos, usamos y protegemos tus datos personales en nuestra tienda.",
};

export default async function PrivacidadPage() {
  const siteName = await getPublicStoreSiteName();

  return (
    <LegalPageLayout
      title="Política de Privacidad"
      description={`En ${siteName} tratamos tu información con cuidado. Aquí te explicamos qué datos usamos y para qué.`}
    >
      <p>
        Esta política describe cómo <strong>{siteName}</strong> recopila y trata
        los datos personales cuando visitas nuestro sitio, creas una cuenta,
        realizas compras o te comunicas con nosotros.
      </p>

      <h2>1. Responsable del tratamiento</h2>
      <p>
        El responsable del tratamiento de tus datos es {siteName}. Puedes
        contactarnos a través de los canales publicados en la página de{" "}
        <Link href="/contacto" className="font-medium text-primary hover:underline">contacto</Link>.
      </p>

      <h2>2. Qué datos recopilamos</h2>
      <p>Podemos tratar las siguientes categorías de información:</p>
      <ul>
        <li>
          <strong>Datos de cuenta:</strong> nombre, correo electrónico y
          contraseña (almacenada de forma segura por nuestro proveedor de
          autenticación).
        </li>
        <li>
          <strong>Datos de perfil:</strong> teléfono, avatar u otra información
          que decidas agregar.
        </li>
        <li>
          <strong>Direcciones de envío:</strong> dirección, ciudad, estado,
          código postal y datos de contacto para la entrega.
        </li>
        <li>
          <strong>Datos de pedidos:</strong> productos comprados, montos,
          método de pago reportado, referencia bancaria, comprobantes adjuntos y
          estado del pedido.
        </li>
        <li>
          <strong>Datos técnicos:</strong> dirección IP, tipo de navegador,
          páginas visitadas y cookies necesarias para el funcionamiento del sitio.
        </li>
      </ul>

      <h2>3. Para qué usamos tus datos</h2>
      <p>Utilizamos tu información para:</p>
      <ul>
        <li>Crear y administrar tu cuenta de usuario.</li>
        <li>Procesar pedidos, pagos y envíos.</li>
        <li>Comunicarnos contigo sobre el estado de tus compras.</li>
        <li>Prevenir fraudes y garantizar la seguridad del sitio.</li>
        <li>Cumplir obligaciones legales o responder requerimientos válidos.</li>
        <li>Mejorar nuestros productos y la experiencia de compra.</li>
      </ul>
      <p>
        No vendemos tu información personal a terceros con fines publicitarios.
      </p>

      <h2>4. Base legal del tratamiento</h2>
      <p>Tratamos tus datos porque:</p>
      <ul>
        <li>Es necesario para ejecutar el contrato de compra que aceptas al pedir.</li>
        <li>Has dado tu consentimiento, cuando corresponda (por ejemplo, al registrarte).</li>
        <li>Tenemos un interés legítimo en operar la tienda de forma segura y eficiente.</li>
        <li>Debemos cumplir obligaciones legales aplicables.</li>
      </ul>

      <h2>5. Con quién compartimos datos</h2>
      <p>Podemos compartir información solo cuando sea necesario con:</p>
      <ul>
        <li>
          <strong>Proveedores de infraestructura:</strong> alojamiento, base de
          datos y autenticación (por ejemplo, Supabase).
        </li>
        <li>
          <strong>Servicios de comunicación:</strong> correo electrónico o
          mensajería, si los utilizamos para notificarte sobre tu pedido.
        </li>
        <li>
          <strong>Autoridades:</strong> cuando la ley lo exija o para proteger
          nuestros derechos legítimos.
        </li>
      </ul>
      <p>
        Estos proveedores solo acceden a los datos indispensables para prestar su
        servicio y deben protegerlos adecuadamente.
      </p>

      <h2>6. Conservación de los datos</h2>
      <p>
        Conservamos tu información mientras mantengas una cuenta activa o sea
        necesario para gestionar pedidos, atender reclamos o cumplir plazos
        legales. Los comprobantes de pago pueden guardarse el tiempo necesario
        para auditoría y resolución de disputas.
      </p>

      <h2>7. Seguridad</h2>
      <p>
        Aplicamos medidas técnicas y organizativas razonables para proteger tus
        datos (cifrado en tránsito, control de acceso, políticas de permisos).
        Ningún sistema es 100 % infalible; si detectas actividad sospechosa en tu
        cuenta, avísanos de inmediato.
      </p>

      <h2>8. Tus derechos</h2>
      <p>Según la normativa aplicable, puedes solicitar:</p>
      <ul>
        <li>Acceso a los datos que tenemos sobre ti.</li>
        <li>Rectificación de datos inexactos o incompletos.</li>
        <li>Eliminación de datos, cuando proceda legalmente.</li>
        <li>Limitación u oposición a ciertos tratamientos.</li>
        <li>Portabilidad de los datos que nos hayas facilitado.</li>
      </ul>
      <p>
        Para ejercer estos derechos, contáctanos. También puedes actualizar gran
        parte de tu información desde la sección{" "}
        <Link href="/perfil">Mi perfil</Link>.
      </p>

      <h2>9. Cookies y almacenamiento local</h2>
      <p>
        Usamos cookies y almacenamiento local del navegador para mantener tu
        sesión iniciada, recordar preferencias (como el carrito de invitado) y
        asegurar el funcionamiento del sitio. Puedes configurar tu navegador
        para bloquear cookies, aunque algunas funciones podrían dejar de
        funcionar correctamente.
      </p>

      <h2>10. Menores de edad</h2>
      <p>
        Nuestros servicios están dirigidos a personas mayores de edad. No
        recopilamos intencionalmente datos de menores. Si crees que un menor nos
        proporcionó información, contáctanos para eliminarla.
      </p>

      <h2>11. Cambios a esta política</h2>
      <p>
        Podemos actualizar esta política para reflejar cambios en nuestros
        procesos o en la legislación. Publicaremos la versión vigente en esta
        página e indicaremos la fecha de actualización.
      </p>

      <h2>12. Contacto</h2>
      <p>
        Si tienes preguntas sobre privacidad, escríbenos desde{" "}
        <Link href="/contacto" className="font-medium text-primary hover:underline">contacto</Link> o consulta nuestras{" "}
        <Link href="/faq">preguntas frecuentes</Link>.
      </p>
    </LegalPageLayout>
  );
}
