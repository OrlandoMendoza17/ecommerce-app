export interface ProductDescriptionProps {
  description: string;
  specifications?: Record<string, string>;
  /** If true, shows tabs even when description is empty */
  alwaysShowTabs?: boolean;
  /** Sin contenedor full-width; para usar dentro de la columna de galería en desktop */
  embedded?: boolean;
  className?: string;
}
