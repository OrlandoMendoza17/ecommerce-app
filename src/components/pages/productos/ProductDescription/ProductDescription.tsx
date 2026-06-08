"use client";

import { useState } from "react";
import { ProductDescriptionProps } from "./ProductDescription.types";

export default function ProductDescription({
  description,
  specifications,
  className = "",
}: ProductDescriptionProps) {
  const hasSpecs = specifications && Object.keys(specifications).length > 0;
  const initialTab: "description" | "specs" = description ? "description" : "specs";
  const [activeTab, setActiveTab] = useState<"description" | "specs">(initialTab);

  return (
    <div className={`bg-white ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("description")}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === "description"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                }
              `}
            >
              Descripción
            </button>
            {hasSpecs && (
              <button
                onClick={() => setActiveTab("specs")}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${
                    activeTab === "specs"
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                  }
                `}
              >
                Especificaciones
              </button>
            )}
          </nav>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          {activeTab === "description" && (
            <div className="text-gray-700 leading-relaxed space-y-4">
              <p>{description}</p>
              
              <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">
                Características destacadas:
              </h3>
              <ul className="list-disc list-inside space-y-2">
                <li>Materiales de calidad y acabados duraderos</li>
                <li>Diseño pensado para el uso diario</li>
                <li>Compatible con el resto de la línea de productos</li>
                <li>Empaque seguro para envío a domicilio</li>
                <li>Garantía del fabricante incluida</li>
                <li>Soporte post-venta disponible</li>
              </ul>

              <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">
                Cuidados y mantenimiento:
              </h3>
              <ul className="list-disc list-inside space-y-2">
                <li>Limpiar con paño suave y seco</li>
                <li>Evitar exposición directa a la luz solar prolongada</li>
                <li>No usar productos químicos abrasivos</li>
                <li>Mantener en ambiente con humedad controlada</li>
              </ul>
            </div>
          )}

          {activeTab === "specs" && hasSpecs && specifications && (
            <div className="bg-gray-50 rounded-lg p-6">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                {Object.entries(specifications).map(([key, value]) => (
                  <div key={key} className="border-b border-gray-200 pb-3">
                    <dt className="text-sm font-semibold text-gray-900 mb-1">
                      {key}
                    </dt>
                    <dd className="text-sm text-gray-700">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
