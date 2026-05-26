"use client";

import { useState } from "react";
import { Star, ShoppingCart, Heart, Package, Truck, Shield, Minus, Plus } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext/CurrencyContext";
import { ProductInfoProps } from "./ProductInfo.types";

export default function ProductInfo({ product, className = "" }: ProductInfoProps) {
  const { formatPrice, currency } = useCurrency();
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  const hasDiscount =
    product.compare_at_price > 0 && product.compare_at_price > product.price;
  const discountPercentage = hasDiscount
    ? Math.round(
        ((product.compare_at_price - product.price) / product.compare_at_price) * 100
      )
    : 0;

  const averageRating = 4.7;
  const reviewCount = 23;

  const handleDecrement = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleIncrement = () => {
    if (quantity < product.stock_quantity) setQuantity(quantity + 1);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Product Name */}
      <div>
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
          {product.name}
        </h1>

        {/* Rating and Reviews */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-5 w-5 ${
                  i < Math.floor(averageRating)
                    ? "text-primary fill-primary"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600">
            {averageRating} ({reviewCount} reseñas)
          </span>
        </div>
      </div>

      {/* Price */}
      <div className="border-t border-b border-gray-200 py-6">
        <div className="flex items-baseline flex-wrap gap-3">
          <span className="text-4xl font-bold text-gray-900">
            {formatPrice(product.price)}
          </span>
          <span className="text-sm text-gray-500 font-medium">
            {currency === "USD" ? "Dólares" : "Bolívares"}
          </span>
          {hasDiscount && (
            <>
              <span className="text-xl text-gray-500 line-through">
                {formatPrice(product.compare_at_price)}
              </span>
              <span className="bg-red-500 text-white text-sm font-bold px-2 py-1 rounded-md">
                -{discountPercentage}% OFF
              </span>
            </>
          )}
        </div>
      </div>

      {/* Stock Status */}
      <div className="flex items-center space-x-2">
        <Package className="h-5 w-5 text-gray-600" />
        <span className={`text-sm font-medium ${
          product.stock_quantity === 0
            ? "text-red-600"
            : product.stock_quantity < 5
            ? "text-orange-600"
            : "text-green-600"
        }`}>
          {product.stock_quantity === 0
            ? "Producto agotado"
            : product.stock_quantity < 5
            ? `Solo ${product.stock_quantity} unidades disponibles`
            : "En stock"}
        </span>
      </div>

      {/* Quantity Selector */}
      {product.stock_quantity > 0 && (
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Cantidad
          </label>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleDecrement}
              disabled={quantity <= 1}
              className="w-10 h-10 flex items-center justify-center border-2 border-gray-300 rounded-lg hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="text-xl font-semibold w-12 text-center">
              {quantity}
            </span>
            <button
              onClick={handleIncrement}
              disabled={quantity >= product.stock_quantity}
              className="w-10 h-10 flex items-center justify-center border-2 border-gray-300 rounded-lg hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3 pt-4">
        {product.stock_quantity > 0 ? (
          <>
            <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-4 rounded-lg flex items-center justify-center space-x-2 transition-colors">
              <ShoppingCart className="h-5 w-5" />
              <span>Añadir al carrito</span>
            </button>
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className={`w-full border-2 font-semibold py-4 rounded-lg flex items-center justify-center space-x-2 transition-colors ${
                isFavorite
                  ? "border-red-500 text-red-600 hover:bg-red-50"
                  : "border-gray-300 text-gray-700 hover:border-gray-400"
              }`}
            >
              <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
              <span>{isFavorite ? "Añadido a favoritos" : "Añadir a favoritos"}</span>
            </button>
          </>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-800 font-semibold">
              Este producto está agotado
            </p>
            <p className="text-red-600 text-sm mt-1">
              Contáctanos para conocer disponibilidad
            </p>
          </div>
        )}
      </div>

      {/* Features */}
      <div className="border-t border-gray-200 pt-6 space-y-4">
        <div className="flex items-start space-x-3">
          <Truck className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-gray-900">Envío a nivel nacional</p>
            <p className="text-sm text-gray-600">Entregas de 5 a 7 días hábiles</p>
          </div>
        </div>
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-gray-900">Garantía de calidad</p>
            <p className="text-sm text-gray-600">Productos verificados y respaldados</p>
          </div>
        </div>
        <div className="flex items-start space-x-3">
          <Package className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-gray-900">Empaque especial</p>
            <p className="text-sm text-gray-600">Protección garantizada en el envío</p>
          </div>
        </div>
      </div>
    </div>
  );
}
