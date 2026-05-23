// Form types and interfaces
import { z } from "zod";

import { DeleteEntityModalProps } from "../DeleteEntityModal.types";
import { getSchema } from "./Form.helpers";

// Component Props
export interface FormProps extends Omit<DeleteEntityModalProps, "children"> {
  className?: string;
  formName: string;
}

export type Schema = z.infer<ReturnType<typeof getSchema>>;
