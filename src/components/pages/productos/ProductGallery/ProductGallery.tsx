"use client";

import { useCallback, useState, type MouseEvent } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { ProductGalleryProps } from "./ProductGallery.types";
import { Separator } from "@/components/ui/separator";

export default function ProductGallery({
  images,
  productName,
  className = "",
}: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const hasMultiple = images.length > 1;

  const goToImage = useCallback(
    (index: number) => {
      if (images.length === 0) return;
      setSelectedImage(((index % images.length) + images.length) % images.length);
    },
    [images.length],
  );

  const handlePrevious = useCallback(
    (event?: MouseEvent) => {
      event?.stopPropagation();
      goToImage(selectedImage - 1);
    },
    [goToImage, selectedImage],
  );

  const handleNext = useCallback(
    (event?: MouseEvent) => {
      event?.stopPropagation();
      goToImage(selectedImage + 1);
    },
    [goToImage, selectedImage],
  );

  const handleDotClick = useCallback(
    (event: MouseEvent, index: number) => {
      event.stopPropagation();
      goToImage(index);
    },
    [goToImage],
  );

  if (images.length === 0) {
    return (
      <div
        className={`relative aspect-square max-h-[504px] w-full bg-gray-100 rounded-lg flex items-center justify-center ${className}`}
      >
        <span className="text-sm text-gray-500">Sin imagen disponible</span>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Mobile: carrusel estilo ProductCard */}
      <div className="md:hidden relative aspect-square max-h-[504px] max-w-[504px] w-full mx-auto bg-gray-100 rounded-lg overflow-hidden group/image">
        {hasMultiple ? (
          <div
            className="flex h-full transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${selectedImage * 100}%)` }}
          >
            {images.map((image, index) => (
              <div key={index} className="relative min-w-full shrink-0 h-full">
                <Image
                  src={image}
                  alt={`${productName} - Imagen ${index + 1}`}
                  fill
                  sizes="100vw"
                  className="object-contain"
                  priority={index === 0}
                />
              </div>
            ))}
          </div>
        ) : (
          <Image
            src={images[0]}
            alt={productName}
            fill
            sizes="100vw"
            className="object-contain"
            priority
          />
        )}

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={handlePrevious}
              className="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-sm"
              aria-label="Imagen anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-sm"
              aria-label="Imagen siguiente"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1">
              {images.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={(event) => handleDotClick(event, index)}
                  className={`h-1.5 rounded-full transition-all ${index === selectedImage
                    ? "w-4 bg-primary"
                    : "w-1.5 bg-gray-400/80"
                    }`}
                  aria-label={`Ver imagen ${index + 1}`}
                  aria-current={index === selectedImage ? "true" : undefined}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Desktop: miniaturas a la izquierda + imagen principal */}
      <div className="hidden md:flex gap-3 items-start">
        {hasMultiple && (
          <div className="flex flex-col gap-2 w-16 lg:w-20 shrink-0 max-h-[504px] overflow-y-auto">
            {images.map((image, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setSelectedImage(index)}
                className={`
                  relative aspect-square w-full rounded-lg overflow-hidden border-2 transition-all shrink-0
                  ${selectedImage === index
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-gray-200 hover:border-gray-400"
                  }
                `}
                aria-label={`Ver imagen ${index + 1}`}
                aria-current={selectedImage === index ? "true" : undefined}
              >
                <Image
                  src={image}
                  alt={`${productName} - Miniatura ${index + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}

        <div className="relative flex-1 min-w-0 w-full aspect-square max-h-[504px] max-w-[504px] mx-auto bg-gray-100 rounded-lg overflow-hidden group">
          <Image
            src={images[selectedImage]}
            alt={`${productName} - Imagen ${selectedImage + 1}`}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-contain"
            priority
          />

          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Imagen anterior"
              >
                <ChevronLeft className="h-6 w-6 text-gray-900" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Imagen siguiente"
              >
                <ChevronRight className="h-6 w-6 text-gray-900" />
              </button>
            </>
          )}

          <div className="absolute top-4 right-4 bg-white/90 px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <ZoomIn className="h-5 w-5 text-gray-700" />
          </div>

          {hasMultiple && (
            <div className="absolute bottom-4 right-4 bg-black/60 text-white text-sm px-3 py-1 rounded-full">
              {selectedImage + 1} / {images.length}
            </div>
          )}
        </div>
      </div>

      <Separator className="mt-12 hidden lg:block" />
    </div>
  );
}
