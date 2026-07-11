"use client";

import Link from "next/link";
import { MessageCircle, Mail } from "lucide-react";
import { FaFacebook, FaInstagram, FaTiktok } from "react-icons/fa";
import BrandLogo from "@/components/widgets/BrandLogo/BrandLogo";
import { trpc } from "@/config/trpc.config";
import {
  STORE_SETTINGS_QUERY_OPTIONS,
  buildWhatsAppUrl,
  mapPublicStoreSettings,
} from "@/lib/store-settings";
import { FooterProps, FooterSection } from "./Footer.types";

const footerSections: FooterSection[] = [
  {
    title: "Tienda",
    links: [
      { label: "Productos", href: "/productos" },
      { label: "Categorías", href: "/categorias" },
    ],
  },
  {
    title: "Ayuda",
    links: [
      { label: "Preguntas Frecuentes", href: "/faq" },
      { label: "Envíos", href: "/envios" },
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
  const { data: settings } = trpc.storeSettings.get.useQuery(
    undefined,
    STORE_SETTINGS_QUERY_OPTIONS
  );

  const store = mapPublicStoreSettings(settings);
  const whatsAppUrl = buildWhatsAppUrl(store.whatsappNumber, "Hola, tengo una consulta sobre la tienda.");

  const socialLinks = [
    { href: store.social.instagram, label: "Instagram", icon: FaInstagram },
    { href: store.social.facebook, label: "Facebook", icon: FaFacebook },
    { href: store.social.tiktok, label: "TikTok", icon: FaTiktok },
  ].filter((item) => item.href);

  return (
    <footer className={`bg-gray-900 text-gray-300 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <div className="mb-4">
              <BrandLogo className="text-white" />
            </div>
            <p className="text-sm mb-6 max-w-md">{store.siteTagline}</p>

            <div className="flex space-x-4">
              {socialLinks.map(({ href, label, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="hover:text-primary transition-colors"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}

              {whatsAppUrl ? (
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="hover:text-primary transition-colors"
                >
                  <MessageCircle className="h-5 w-5" />
                </a>
              ) : null}

              {store.supportEmail ? (
                <a
                  href={`mailto:${store.supportEmail}`}
                  aria-label="Correo electrónico"
                  className="hover:text-primary transition-colors"
                >
                  <Mail className="h-5 w-5" />
                </a>
              ) : null}
            </div>
          </div>

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
              <p>{store.footerText}</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
