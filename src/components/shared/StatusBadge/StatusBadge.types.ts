import React from "react";

export type StatusBadgeVariant = "soft" | "solid";
export type StatusBadgeSize = "sm" | "md" | "lg";

export interface OrderStatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: OrderStatus | string;
  variant?: StatusBadgeVariant;
  size?: StatusBadgeSize;
  showIcon?: boolean;
  className?: string;
}

export interface PaymentStatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: PaymentStatus | string;
  variant?: StatusBadgeVariant;
  size?: StatusBadgeSize;
  showIcon?: boolean;
  className?: string;
}

export interface ActiveStatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  active: boolean;
  gender?: "male" | "female";
  activeLabel?: string;
  inactiveLabel?: string;
  variant?: StatusBadgeVariant;
  size?: StatusBadgeSize;
  className?: string;
}
