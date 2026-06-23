import { ADMIN_ICON_MAP } from "@/components/pages/admin/admin-icons";
import type { QuickActionsCardProps } from "../QuickActionsCard/QuickActionsCard.types";
import quickActionsConfig from "./admin-quick-actions.json";

type QuickActionConfig = {
  label: string;
  href: string;
  icon: string;
  color: string;
  bgColor: string;
};

export function getAdminQuickActions(): QuickActionsCardProps[] {
  return (quickActionsConfig as QuickActionConfig[]).map((action) => {
    const Icon = ADMIN_ICON_MAP[action.icon];

    if (!Icon) {
      throw new Error(`Icono de acceso rápido no registrado: ${action.icon}`);
    }

    return {
      label: action.label,
      href: action.href,
      Icon,
      color: action.color,
      bgColor: action.bgColor,
    };
  });
}
