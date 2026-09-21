import React from "react";
import { cn } from "@/lib/utils";
import { getOrderStatusLabel } from "@/lib/order-status";
import { OrderStatusBadgeProps } from "./StatusBadge.types";
import {
  getOrderStatusBadgeClass,
  ORDER_STATUS_ICONS,
  STATUS_BADGE_SIZES,
} from "./StatusBadge.config";

export default function OrderStatusBadge({
  status,
  variant = "soft",
  size = "sm",
  showIcon = false,
  className,
  ...props
}: OrderStatusBadgeProps) {
  const Icon = showIcon ? ORDER_STATUS_ICONS[status] : null;
  const label = getOrderStatusLabel(status as OrderStatus);
  const colorClass = getOrderStatusBadgeClass(status, variant);
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
      {Icon && <Icon className={sizeConfig.icon} aria-hidden />}
      <span>{label}</span>
    </span>
  );
}
