/**
 * Sistema de plantillas SEO tipo WordPress: permite guardar tokens como
 * "%{sitename}% | E-commerce" en vez del valor final, para que se mantengan
 * sincronizados automáticamente cuando cambian los datos de la tienda.
 */
export type SeoTemplateVars = {
  sitename: string;
  tagline: string;
};

export const SEO_TEMPLATE_TOKENS: { token: string; label: string }[] = [
  { token: "%{sitename}%", label: "Nombre de la tienda" },
  { token: "%{tagline}%", label: "Eslogan" },
];

const TOKEN_PATTERN = /%\{(\w+)\}%/g;

/** Sustituye los tokens `%{token}%` de una plantilla por sus valores actuales. */
export function resolveSeoTemplate(
  template: string,
  vars: SeoTemplateVars
): string {
  if (!template?.trim()) return "";

  return template
    .replace(TOKEN_PATTERN, (match, key: string) => {
      const value = vars[key as keyof SeoTemplateVars];
      return value ?? match;
    })
    .trim();
}
