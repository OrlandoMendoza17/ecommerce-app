"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import CategoriesGrid from "@/components/pages/categorias/CategoriesGrid/CategoriesGrid";
import { FeaturedCategoriesProps } from "./FeaturedCategories.types";

const FEATURED_CATEGORIES_LIMIT = 4;

export default function FeaturedCategories({ className = "" }: FeaturedCategoriesProps) {
  return (
    <section className={`bg-white py-16 lg:py-24 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Explora por Categoría
            </h2>
            <p className="text-gray-600">
              Encuentra el estilo perfecto para tu espacio
            </p>
          </div>
          <Link
            href="/categorias"
            className="hidden sm:flex items-center text-primary hover:text-primary/80 font-medium group"
          >
            <span>Ver todas</span>
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <CategoriesGrid limit={FEATURED_CATEGORIES_LIMIT} />

        <div className="mt-8 sm:hidden text-center">
          <Link
            href="/categorias"
            className="inline-flex items-center text-primary hover:text-primary/80 font-medium group"
          >
            <span>Ver todas las categorías</span>
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
