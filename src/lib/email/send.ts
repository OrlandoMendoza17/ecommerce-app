import "server-only";

import type { ReactElement } from "react";
import { resend } from "@/lib/email/client";
import type { EmailType, SendEmailResult } from "@/lib/email/types";

export type SendEmailOptions = {
  type: EmailType;
  to: string | string[];
  subject: string;
  react: ReactElement;
  tags?: Array<{ name: string; value: string }>;
  /** When true, rethrow after logging. Default false — order flows must not fail. */
  throwOnError?: boolean;
};

export async function sendEmail(opts: SendEmailOptions): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();

  if (!apiKey || !from) {
    console.warn("[email] missing RESEND_API_KEY or EMAIL_FROM, skip", opts.type);
    return { skipped: true, reason: "missing_config" };
  }

  const to = Array.isArray(opts.to) ? opts.to : [opts.to];
  if (to.length === 0 || to.every((addr) => !addr?.trim())) {
    console.warn("[email] empty recipient, skip", opts.type);
    return { skipped: true, reason: "empty_recipient" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: to.map((addr) => addr.trim()).filter(Boolean),
      subject: opts.subject,
      react: opts.react,
      tags: opts.tags,
    });

    if (error) {
      console.error("[email]", opts.type, error);
      if (opts.throwOnError) throw error;
      return { data: data ?? null, error };
    }

    return { data: data ?? null, error: null };
  } catch (err) {
    console.error("[email]", opts.type, err);
    if (opts.throwOnError) throw err;
    return { data: null, error: err };
  }
}
