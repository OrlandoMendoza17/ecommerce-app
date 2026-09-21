import React from "react";
import {
  Clock,
  Send,
  CheckCircle2,
  Truck,
  XCircle,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import { StatusBadgeSize, StatusBadgeVariant } from "./StatusBadge.types";

export const ORDER_STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  pending_payment: Clock,
  payment_submitted: Send,
  payment_confirmed: CheckCircle2,
  shipped: Truck,
  delivered: CheckCircle2,
  cancelled: XCircle,
  refunded: RotateCcw,
};

export const ORDER_STATUS_CLASSES: Record<
  StatusBadgeVariant,
  Record<string, string>
> = {
  soft: {
    pending_payment: "bg-warning-foreground text-warning",
    payment_submitted: "bg-warning-foreground text-warning",
    payment_confirmed: "bg-info-foreground text-info",
    shipped: "bg-indigo-foreground text-indigo",
    delivered: "bg-success-foreground text-success",
    cancelled: "bg-muted text-muted-foreground",
    refunded: "bg-muted text-muted-foreground",
  },
  solid: {
    pending_payment: "bg-warning text-warning-foreground",
    payment_submitted: "bg-warning text-warning-foreground",
    payment_confirmed: "bg-info text-info-foreground",
    shipped: "bg-indigo text-indigo-foreground",
    delivered: "bg-success text-success-foreground",
    cancelled: "bg-destructive text-destructive-foreground",
    refunded: "bg-muted text-foreground",
  },
};

export const PAYMENT_STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  pending: Clock,
  submitted: Send,
  confirmed: CheckCircle2,
  failed: AlertCircle,
};

export const PAYMENT_STATUS_CLASSES: Record<
  StatusBadgeVariant,
  Record<string, string>
> = {
  soft: {
    pending: "bg-warning-foreground text-warning",
    submitted: "bg-warning-foreground text-warning",
    confirmed: "bg-info-foreground text-info",
    failed: "bg-destructive-foreground text-destructive",
  },
  solid: {
    pending: "bg-warning text-warning-foreground",
    submitted: "bg-warning text-warning-foreground",
    confirmed: "bg-info text-info-foreground",
    failed: "bg-destructive text-destructive-foreground",
  },
};

export const STATUS_BADGE_SIZES: Record<
  StatusBadgeSize,
  { badge: string; icon: string }
> = {
  sm: {
    badge: "px-2 py-0.5 text-xs",
    icon: "h-3 w-3 shrink-0",
  },
  md: {
    badge: "px-2.5 py-1 text-xs",
    icon: "h-3.5 w-3.5 shrink-0",
  },
  lg: {
    badge: "px-3 py-1.5 text-sm",
    icon: "h-4 w-4 shrink-0",
  },
};

export function getOrderStatusBadgeClass(
  status: OrderStatus | string,
  variant: StatusBadgeVariant = "soft"
): string {
  const classes = ORDER_STATUS_CLASSES[variant];
  return classes[status] ?? "bg-muted text-muted-foreground";
}

export function getPaymentStatusBadgeClass(
  status: PaymentStatus | string,
  variant: StatusBadgeVariant = "soft"
): string {
  const classes = PAYMENT_STATUS_CLASSES[variant];
  return classes[status] ?? "bg-muted text-muted-foreground";
}
