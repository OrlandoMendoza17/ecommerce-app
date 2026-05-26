import { MessageCircle } from "lucide-react";
import ContactForm from "@/components/pages/contacto/ContactForm/ContactForm";
import ContactInfo from "@/components/pages/contacto/ContactInfo/ContactInfo";

export default function ContactoPage() {
  return (
    <div className="bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center space-x-3 mb-2">
            <MessageCircle className="h-8 w-8 text-primary" />
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Contáctanos
            </h1>
          </div>
          <p className="text-gray-600">
            ¿Tienes alguna pregunta? Estamos aquí para ayudarte
          </p>
        </div>
      </div>

      {/* Contact Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 lg:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Envíanos un mensaje
            </h2>
            <ContactForm />
          </div>

          {/* Contact Info */}
          <div>
            <ContactInfo />
          </div>
        </div>
      </div>

      {/* FAQ CTA Section */}
      <div className="bg-white border-t border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              ¿Buscas información sobre envíos o devoluciones?
            </h2>
            <p className="text-gray-600 mb-6">
              Visita nuestras secciones de ayuda para encontrar respuestas a las
              preguntas más comunes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/envios"
                className="inline-flex items-center justify-center px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-900 font-semibold hover:bg-gray-50 transition-colors"
              >
                Información de envíos
              </a>
              <a
                href="/devoluciones"
                className="inline-flex items-center justify-center px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-900 font-semibold hover:bg-gray-50 transition-colors"
              >
                Política de devoluciones
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
