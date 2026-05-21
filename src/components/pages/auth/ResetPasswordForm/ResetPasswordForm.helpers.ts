import { vAuth } from "@/validations/auth.validations"

export const schema = vAuth.resetPasswordForm()

export const defaultValues = {
  password: "",
  confirmPassword: "",
}

