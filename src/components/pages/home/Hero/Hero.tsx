import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { HeroProps } from "./Hero.types";

export default function Hero({ className = "" }: HeroProps) {
  return (
    <section className={`relative bg-gradient-to-br from-primary/5 via-background to-primary/5 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              <span>Compras online simples y seguras</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Todo lo que necesitas en
              <span className="text-primary"> un solo lugar </span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl">
              Explora nuestro catálogo de productos, compara precios y compra con
              los métodos de pago que prefieras. Envío a todo el país.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/productos"
                className="inline-flex items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-4 rounded-lg transition-colors group"
              >
                <span>Ver Catálogo</span>
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/contacto"
                className="inline-flex items-center justify-center bg-background hover:bg-muted text-foreground font-semibold px-8 py-4 rounded-lg border-2 border-border transition-colors"
              >
                Contáctanos
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border">
              <div>
                <p className="text-3xl font-bold text-foreground">500+</p>
                <p className="text-sm text-muted-foreground">Productos</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">1,200+</p>
                <p className="text-sm text-muted-foreground">Clientes</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">100%</p>
                <p className="text-sm text-muted-foreground">Garantizado</p>
              </div>
            </div>
          </div>

          {/* Image Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="relative h-64 rounded-2xl overflow-hidden shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800"
                  alt="Producto destacado 1"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="relative h-40 rounded-2xl overflow-hidden shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800"
                  alt="Producto destacado 2"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="space-y-4 pt-8">
              <div className="relative h-40 rounded-2xl overflow-hidden shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1572635196237-14bffe7a5870?w=800"
                  alt="Producto destacado 3"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="relative h-64 rounded-2xl overflow-hidden shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800"
                  alt="Producto destacado 4"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
