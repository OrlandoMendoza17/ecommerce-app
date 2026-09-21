import React from "react";
import { cn } from "@/lib/utils";
import { getPaymentStatusLabel } from "@/lib/order-status";
import { PaymentStatusBadgeProps } from "./StatusBadge.types";
import {
  getPaymentStatusBadgeClass,
  PAYMENT_STATUS_ICONS,
  STATUS_BADGE_SIZES,
} from "./StatusBadge.config";

export default function PaymentStatusBadge({
  status,
  variant = "soft",
  size = "sm",
  showIcon = false,
  className,
  ...props
}: PaymentStatusBadgeProps) {
  const Icon = showIcon ? PAYMENT_STATUS_ICONS[status] : null;
  const label = getPaymentStatusLabel(status as PaymentStatus);
  const colorClass = getPaymentStatusBadgeClass(status, variant);
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
