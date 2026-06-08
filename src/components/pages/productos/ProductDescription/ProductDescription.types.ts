export interface ProductDescriptionProps {
  description: string;
  specifications?: Record<string, string>;
  /** If true, shows tabs even when description is empty */
  alwaysShowTabs?: boolean;
  className?: string;
}
