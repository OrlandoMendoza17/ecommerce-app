import { z } from "zod"
import { schema } from "./ForgotPasswordForm.helpers"

export type ForgotPasswordForm = z.infer<typeof schema>

export interface ResetPasswordFormProps {
}

