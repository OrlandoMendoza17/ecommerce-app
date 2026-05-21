import { z } from "zod"
import { registerFormSchema } from "./RegisterForm.helpers"

export type RegisterForm = z.infer<typeof registerFormSchema>

export interface RegisterFormProps {
}