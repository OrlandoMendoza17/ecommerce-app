import { vAuth } from "@/validations/auth.validations"

export const schema = vAuth.loginForm()

export const defaultValues = {
  email: '',
  password: '',
}