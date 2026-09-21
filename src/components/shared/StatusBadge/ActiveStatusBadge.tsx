import React from "react";
import { cn } from "@/lib/utils";
import { ActiveStatusBadgeProps } from "./StatusBadge.types";
import { STATUS_BADGE_SIZES } from "./StatusBadge.config";

export default function ActiveStatusBadge({
  active,
  gender = "male",
  activeLabel,
  inactiveLabel,
  variant = "soft",
  size = "sm",
  className,
  ...props
}: ActiveStatusBadgeProps) {
  const defaultActiveLabel =
    activeLabel ?? (gender === "female" ? "Activa" : "Activo");
  const defaultInactiveLabel =
    inactiveLabel ?? (gender === "female" ? "Inactiva" : "Inactivo");

  const label = active ? defaultActiveLabel : defaultInactiveLabel;

  const colorClass = active
    ? variant === "solid"
      ? "bg-success text-success-foreground"
      : "bg-success-foreground text-success"
    : "bg-muted text-muted-foreground";

  const sizeConfig = STATUS_BADGE_SIZES[size] ?? STATUS_BADGE_SIZES.sm;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap transition-colors",
        sizeConfig.badge,
        colorClass,
        className
      )}
      {...props}
    >
      <span>{label}</span>
    </span>
  );
}
