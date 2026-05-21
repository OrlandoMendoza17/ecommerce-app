
import { vAuth } from "@/validations/auth.validations"

export const schema = vAuth.forgotPasswordForm()

export const defaultValues = {
  email: "",
}

