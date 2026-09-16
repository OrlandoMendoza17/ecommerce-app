"use client";

import { ProductDescriptionProps } from "./ProductDescription.types";

export default function ProductDescription({
  description,
  specifications,
  embedded = false,
  className = "",
}: ProductDescriptionProps) {
  const hasSpecs = specifications && Object.keys(specifications).length > 0;
  const hasDescription = Boolean(description?.trim());

  if (!hasSpecs && !hasDescription) {
    return null;
  }

  return (
    <div className={`bg-card ${className}`}>
      <div
        className={
          embedded
            ? "space-y-10"
            : "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-10"
        }
      >
        {hasSpecs && specifications && (
          <section>
            <h2 className="text-xl font-bold text-foreground mb-6">Especificaciones</h2>
            <div className="bg-muted rounded-lg p-6">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                {Object.entries(specifications).map(([key, value]) => (
                  <div key={key} className="border-b border-border pb-3">
                    <dt className="text-sm font-semibold text-foreground mb-1">{key}</dt>
                    <dd className="text-sm text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>
        )}

        {hasDescription && (
          <section>
            <h2 className="text-xl font-bold text-foreground mb-6">Descripción</h2>
            <div className="prose prose-lg max-w-none text-foreground leading-relaxed">
              <p>{description}</p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
