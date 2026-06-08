import type { ReactNode } from "react";

export interface PaymentMethodModalProps {
  className?: string;
  children?: ReactNode;
  paymentMethod?: PaymentMethod;
}
