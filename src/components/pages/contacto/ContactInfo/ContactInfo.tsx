import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { FaInstagram, FaWhatsapp } from "react-icons/fa";
import { ContactInfoProps, ContactMethod } from "./ContactInfo.types";

const contactMethods: ContactMethod[] = [
  {
    icon: Mail,
    label: "Email",
    value: "info@tienda.com",
    link: "mailto:info@tienda.com",
  },
  {
    icon: Phone,
    label: "Teléfono",
    value: "+58 424 123 4567",
    link: "tel:+584241234567",
  },
  {
    icon: FaWhatsapp,
    label: "WhatsApp",
    value: "+58 424 123 4567",
    link: "https://wa.me/584241234567",
  },
  {
    icon: FaInstagram,
    label: "Instagram",
    value: "@tiendaonline",
    link: "https://instagram.com/tiendaonline",
  },
];

export default function ContactInfo({ className = "" }: ContactInfoProps) {
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
        {contactMethods.map((method, index) => {
          const Icon = method.icon;
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

          return method.link ? (
            <a
              key={index}
              href={method.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              {content}
            </a>
          ) : (
            <div key={index}>{content}</div>
          );
        })}
      </div>

      {/* Business Hours */}
      <div className="border-t border-gray-200 pt-8">
        <div className="flex items-start space-x-4">
          <div className="shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Clock className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-3">
              Horario de atención
            </p>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex justify-between">
                <span className="font-medium">Lunes - Viernes:</span>
                <span>9:00 AM - 6:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Sábados:</span>
                <span>10:00 AM - 4:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Domingos:</span>
                <span className="text-red-600">Cerrado</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="border-t border-gray-200 pt-8">
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
      </div>

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
