export type StatusPageCode = "404" | "500" | "error";

export type StatusPageAction = {
  label: string;
  href?: string;
  variant?: "default" | "outline" | "link";
  onClick?: () => void;
};

export type StatusPageProps = {
  code: StatusPageCode;
  title: string;
  description: string;
  actions?: StatusPageAction[];
  className?: string;
};
