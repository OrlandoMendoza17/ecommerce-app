import { z } from "zod"
import { schema } from "./LoginForm.helpers"

export type LoginForm = z.infer<typeof schema>

export type LoginFormProps = {
}