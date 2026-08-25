"use client";

import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { FaInstagram, FaWhatsapp } from "react-icons/fa";
import { trpc } from "@/config/trpc.config";
import {
  STORE_SETTINGS_QUERY_OPTIONS,
  buildContactMethods,
  mapPublicStoreSettings,
  type ContactMethodKind,
} from "@/lib/store-settings";
import { ContactInfoProps } from "./ContactInfo.types";

const METHOD_ICONS: Record<
  ContactMethodKind,
  React.ComponentType<{ className?: string }>
> = {
  email: Mail,
  phone: Phone,
  whatsapp: FaWhatsapp,
  instagram: FaInstagram,
};

export default function ContactInfo({ className = "" }: ContactInfoProps) {
  const { data, isLoading } = trpc.storeSettings.get.useQuery(
    undefined,
    STORE_SETTINGS_QUERY_OPTIONS
  );

  const store = mapPublicStoreSettings(data);
  const contactMethods = buildContactMethods(store);

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Información de contacto
        </h2>
        <p className="text-gray-600">
          Estamos aquí para ayudarte. Contáctanos por cualquiera de estos medios.
        </p>
      </div>

      {/* Contact Methods */}
      <div className="space-y-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg animate-pulse"
            >
              <div className="shrink-0 w-12 h-12 bg-gray-200 rounded-lg" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 w-20 bg-gray-200 rounded" />
                <div className="h-4 w-40 bg-gray-200 rounded" />
              </div>
            </div>
          ))
          : contactMethods.map((method) => {
            const Icon = METHOD_ICONS[method.kind];
            const isExternal =
              method.kind === "whatsapp" || method.kind === "instagram";
            const content = (
              <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 mb-1">
                    {method.label}
                  </p>
                  <p className="text-gray-700">{method.value}</p>
                </div>
              </div>
            );

            return (
              <a
                key={method.kind}
                href={method.href}
                {...(isExternal
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="block"
              >
                {content}
              </a>
            );
          })}
      </div>

      {/* Business Hours */}
      {/* <div className="border-t border-gray-200 pt-8">
        <div className="flex items-start space-x-4">
          <div className="shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Clock className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-3">
              Horario de atención
            </p>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex justify-between gap-6">
                <span className="font-medium">Lunes - Viernes:</span>
                <span>9:00 AM - 6:00 PM</span>
              </div>
              <div className="flex justify-between gap-6">
                <span className="font-medium">Sábados:</span>
                <span>10:00 AM - 4:00 PM</span>
              </div>
              <div className="flex justify-between gap-6">
                <span className="font-medium">Domingos:</span>
                <span className="text-red-600">Cerrado</span>
              </div>
            </div>
          </div>
        </div>
      </div> */}

      {/* Location */}
      {/* <div className="border-t border-gray-200 pt-8">
        <div className="flex items-start space-x-4">
          <div className="shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <MapPin className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-2">
              Ubicación
            </p>
            <p className="text-gray-700 text-sm">
              Caracas, Venezuela
              <br />
              Zona metropolitana
            </p>
          </div>
        </div>
      </div> */}

      {/* Additional Info */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-2">
          ¿Tienes una pregunta rápida?
        </h3>
        <p className="text-sm text-gray-700 mb-4">
          Consulta nuestra sección de preguntas frecuentes antes de contactarnos.
          Quizás encuentres la respuesta que buscas.
        </p>
        <a
          href="/faq"
          className="inline-flex items-center text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          Ver preguntas frecuentes
          <span className="ml-2">→</span>
        </a>
      </div>
    </div>
  );
}
