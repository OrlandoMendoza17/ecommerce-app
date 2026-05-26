"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { ProductOptionsProps, ProductOption } from "./ProductOptions.types";

export default function ProductOptions({
  dimensions,
  thicknesses,
  className = "",
}: ProductOptionsProps) {
  const [selectedDimension, setSelectedDimension] = useState<string>("");
  const [selectedThickness, setSelectedThickness] = useState<string>("");

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Dimensions */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          Talla
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {dimensions.map((option) => (
            <button
              key={option.id}
              onClick={() => option.available && setSelectedDimension(option.value)}
              disabled={!option.available}
              className={`
                relative px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all
                ${
                  selectedDimension === option.value
                    ? "border-primary bg-primary/10 text-primary"
                    : option.available
                    ? "border-gray-300 hover:border-gray-400 text-gray-900"
                    : "border-gray-200 text-gray-400 cursor-not-allowed"
                }
              `}
            >
              <span>{option.label}</span>
              {selectedDimension === option.value && (
                <Check className="absolute top-2 right-2 h-4 w-4 text-primary" />
              )}
              {!option.available && (
                <span className="absolute inset-0 flex items-center justify-center bg-white/80 text-xs font-semibold text-red-600">
                  No disponible
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Thicknesses */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          Color
        </label>
        <div className="grid grid-cols-3 gap-3">
          {thicknesses.map((option) => (
            <button
              key={option.id}
              onClick={() => option.available && setSelectedThickness(option.value)}
              disabled={!option.available}
              className={`
                relative px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all
                ${
                  selectedThickness === option.value
                    ? "border-primary bg-primary/10 text-primary"
                    : option.available
                    ? "border-gray-300 hover:border-gray-400 text-gray-900"
                    : "border-gray-200 text-gray-400 cursor-not-allowed"
                }
              `}
            >
              <span>{option.label}</span>
              {selectedThickness === option.value && (
                <Check className="absolute top-2 right-2 h-4 w-4 text-primary" />
              )}
              {!option.available && (
                <span className="absolute inset-0 flex items-center justify-center bg-white/80 text-xs font-semibold text-red-600">
                  Agotado
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Selection Summary */}
      {(selectedDimension || selectedThickness) && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Selección actual:</span>
            {selectedDimension && (
              <span className="ml-2">
                Talla: <strong>{selectedDimension}</strong>
              </span>
            )}
            {selectedThickness && (
              <span className="ml-2">
                Color: <strong>{selectedThickness}</strong>
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
