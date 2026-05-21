import { LucideIcon } from "lucide-react";

export type StatCardVariant = "default" | "warning" | "info" | "success" | "danger";

export type StatCardIconKey =
  | "users"
  | "shield"
  | "userCheck"
  | "calendar"
  | "fileCheck"
  | "dollarSign"
  | "userCog"
  | "alertCircle"
  | "userPlus"
  | "plus"
  | "mapPin"
  | "settings"
  | "barChart"
  | "activity"
  | "trophy";

export type StatCardProps = {
  label: string;
  activeCount: number;
  pendingCount?: number;
  iconKey: StatCardIconKey;
  variant?: StatCardVariant;
  href?: string;
  isLoading?: boolean;
};

export type StatCardIconConfig = {
  icon: LucideIcon;
  color: string;
  bgColor: string;
};
