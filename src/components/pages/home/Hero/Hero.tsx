"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useParallaxOffset } from "@/hooks/useParallaxOffset";
import { HERO_AUTOPLAY_MS, heroSlides } from "./Hero.config";
import { HeroProps } from "./Hero.types";

export default function Hero({ className = "" }: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const parallaxOffset = useParallaxOffset(sectionRef);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const goTo = useCallback((index: number) => {
    const total = heroSlides.length;
    setActiveIndex(((index % total) + total) % total);
  }, []);

  const goNext = useCallback(() => {
    goTo(activeIndex + 1);
  }, [activeIndex, goTo]);

  const goPrev = useCallback(() => {
    goTo(activeIndex - 1);
  }, [activeIndex, goTo]);

  useEffect(() => {
    if (isPaused) return;

    const timer = window.setInterval(goNext, HERO_AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [goNext, isPaused]);

  return (
    <section
      ref={sectionRef}
      className={`relative overflow-hidden ${className}`}
      aria-roledescription="carousel"
      aria-label="Destacados de la tienda"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsPaused(false);
        }
      }}
    >
      <div className="relative h-[420px] sm:h-[480px] lg:h-[560px]">
        <div
          className="flex h-full transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {heroSlides.map((slide, index) => (
            <Link
              key={slide.id}
              href={slide.href}
              className="group relative block min-w-full shrink-0 overflow-hidden"
              aria-label={`${slide.title}. ${slide.description}`}
            >
              <div className="absolute inset-0 overflow-hidden" aria-hidden>
                <div
                  className="absolute top-0 left-0 h-[130%] w-full will-change-transform"
                  style={{ transform: `translateY(${parallaxOffset}px)` }}
                >
                  <div className="relative h-full w-full transition-transform duration-700 group-hover:scale-[1.02]">
                    <Image
                      src={slide.imageUrl}
                      alt={slide.imageAlt}
                      fill
                      priority={index === 0}
                      sizes="100vw"
                      className="object-cover object-top"
                    />
                  </div>
                </div>
              </div>

              <div className="absolute inset-0 bg-linear-to-r from-black/75 via-black/50 to-black/20" />

              <div className="absolute inset-0 flex items-center">
                <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                  <div className="max-w-2xl space-y-4 text-white">
                    <h2 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                      {slide.title}
                    </h2>
                    <p className="text-base text-white/90 sm:text-lg lg:text-xl">
                      {slide.description}
                    </p>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-white/90 transition-colors group-hover:text-white sm:text-base">
                      Ver más
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 sm:h-5 sm:w-5" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <button
          type="button"
          onClick={goPrev}
          className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60 sm:left-6 sm:h-11 sm:w-11"
          aria-label="Slide anterior"
        >
          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        <button
          type="button"
          onClick={goNext}
          className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60 sm:right-6 sm:h-11 sm:w-11"
          aria-label="Slide siguiente"
        >
          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2 sm:bottom-6">
          {heroSlides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => goTo(index)}
              className={`h-2 rounded-full transition-all ${
                index === activeIndex
                  ? "w-8 bg-white"
                  : "w-2 bg-white/50 hover:bg-white/80"
              }`}
              aria-label={`Ir al slide ${index + 1}: ${slide.title}`}
              aria-current={index === activeIndex ? "true" : undefined}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
