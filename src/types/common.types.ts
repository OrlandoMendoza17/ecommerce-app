import { z } from "zod";

import { vCommon } from "@/validations/common.validations";

export type VariantTypes =
  | "active"
  | "inactive"
  | "destructive"
  | "default"
  | "outline";

export type MimeType = z.infer<ReturnType<typeof vCommon.mimeType>>;

export interface DNSRecord {
  type: string;
  value: string;
  name: string;
  ttl?: string;
  status?: string;
}

export type CrossOrigin = "anonymous" | "use-credentials" | "" | undefined;
