import { vAuth } from "@/validations/auth.validations"

export const registerFormSchema = vAuth.registerForm()

export const defaultValues = {
  email: "",
  phone: "",
  full_name: "",
  password: "",
}
