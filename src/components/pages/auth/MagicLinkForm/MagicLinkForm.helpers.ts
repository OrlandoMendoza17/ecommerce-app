import { vAuth } from "@/validations/auth.validations"

export const schema = vAuth.magicLinkForm()

export const defaultValues = {
  email: "",
}
