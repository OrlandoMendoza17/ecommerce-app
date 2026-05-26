import Link from "next/link";
import { MessageCircle, Mail } from "lucide-react";
import { FaInstagram } from "react-icons/fa";
import BrandLogo from "@/components/widgets/BrandLogo/BrandLogo";
import { FooterProps, FooterSection } from "./Footer.types";

const footerSections: FooterSection[] = [
  {
    title: "Tienda",
    links: [
      { label: "Productos", href: "/productos" },
      { label: "Categorías", href: "/categorias" },
      { label: "Ofertas", href: "/ofertas" },
    ],
  },
  {
    title: "Ayuda",
    links: [
      { label: "Preguntas Frecuentes", href: "/faq" },
      { label: "Envíos", href: "/envios" },
      { label: "Devoluciones", href: "/devoluciones" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Términos y Condiciones", href: "/terminos" },
      { label: "Política de Privacidad", href: "/privacidad" },
    ],
  },
];

const paymentMethods = [
  "Transferencia Bancaria",
  "Pago Móvil",
  "Zelle",
  "Zinli",
  "Binance",
];

export default function Footer({ className = "" }: FooterProps) {
  return (
    <footer className={`bg-gray-900 text-gray-300 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <BrandLogo className="text-white" />
            </div>
            <p className="text-sm mb-6 max-w-md">
              Tu tienda online para comprar productos de distintas categorías.
              Envíos, pagos flexibles y atención al cliente.
            </p>

            {/* Social Links */}
            <div className="flex space-x-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                <FaInstagram className="h-5 w-5" />
              </a>
              <a
                href="https://wa.me/1234567890"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
              <a
                href="mailto:info@tienda.com"
                className="hover:text-primary transition-colors"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-white font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Payment Methods */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h4 className="text-sm font-semibold text-white mb-2">
                Métodos de pago aceptados
              </h4>
              <div className="flex flex-wrap gap-2">
                {paymentMethods.map((method) => (
                  <span
                    key={method}
                    className="text-xs bg-gray-800 px-3 py-1 rounded-full"
                  >
                    {method}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-sm">
              <p>© 2026 Ecommerce App. Todos los derechos reservados.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
