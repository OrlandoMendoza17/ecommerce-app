export interface ContactInfoProps {
  className?: string;
}

export interface ContactMethod {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  link?: string;
}
