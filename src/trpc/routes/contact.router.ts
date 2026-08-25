import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "@/trpc";
import { getSupportEmail, notifyContactMessage } from "@/lib/email";

const contactSendSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  email: z.string().trim().email("Email inválido").max(200),
  subject: z.string().trim().min(1, "El asunto es obligatorio").max(120),
  message: z.string().trim().min(1, "El mensaje es obligatorio").max(5000),
  /** Honeypot — bots fill this; humans leave it empty */
  website: z.string().optional(),
});

const SUBJECT_LABELS: Record<string, string> = {
  consulta: "Consulta general",
  pedido: "Seguimiento de pedido",
  producto: "Consulta sobre producto",
  devoluciones: "Devoluciones y cambios",
  otros: "Otros",
};

export const contactRouter = router({
  send: publicProcedure.input(contactSendSchema).mutation(async ({ input }) => {
    if (input.website?.trim()) {
      return { success: true };
    }

    const toAdmin = await getSupportEmail();
    if (!toAdmin) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "No hay correo de soporte configurado. Intenta más tarde.",
      });
    }

    const subjectLabel = SUBJECT_LABELS[input.subject] ?? input.subject;

    const result = await notifyContactMessage({
      toAdmin,
      name: input.name,
      email: input.email,
      subject: subjectLabel,
      message: input.message,
    });

    if ("skipped" in result && result.skipped) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "No se pudo enviar el mensaje. Intenta más tarde.",
      });
    }

    if (result.error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "No se pudo enviar el mensaje. Intenta más tarde.",
      });
    }

    return { success: true };
  }),
});
