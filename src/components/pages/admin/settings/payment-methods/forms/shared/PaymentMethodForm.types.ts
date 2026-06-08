import type { PaymentMethodType } from "@/constants/payment-methods";

export interface PaymentMethodFormProps {
  formName: string;
  handleClose: () => void;
  is_active: boolean;
  name: string;
  selectedType: PaymentMethodType;
  paymentMethod?: PaymentMethod;
}
