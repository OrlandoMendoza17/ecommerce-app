import { z } from "zod"
import { schema } from "./MagicLinkForm.helpers"

export type MagicLinkForm = z.infer<typeof schema>

export interface MagicLinkFormProps {}
