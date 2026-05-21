import { z } from "zod"
import { schema } from "./ResetPasswordForm.helpers"

export type ResetPasswordForm = z.infer<typeof schema>

export interface ResetPasswordFormProps {
  onSuccess?: () => void;
}

