"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import FormInput from "@/components/form/FormInput/FormInput";
import {
  guestContactSchema,
  guestContactDefaultValues,
  type GuestContactFormValues,
} from "./GuestContactModal.helpers";

interface GuestContactModalProps {
  open: boolean;
  isSubmitting: boolean;
  onSubmit: (values: GuestContactFormValues) => Promise<void>;
  onClose: () => void;
}

export function GuestContactModal({
  open,
  isSubmitting,
  onSubmit,
  onClose,
}: GuestContactModalProps) {
  const form = useForm<GuestContactFormValues>({
    resolver: zodResolver(guestContactSchema),
    defaultValues: guestContactDefaultValues,
  });

  const { control, handleSubmit } = form;

  const handleFormSubmit = handleSubmit(onSubmit);

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !isSubmitting) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Datos de contacto</DialogTitle>
          <DialogDescription>
            Necesitamos tus datos para procesar el pedido y enviarte la confirmación.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id="guest-contact-form"
            onSubmit={handleFormSubmit}
            noValidate
            className="space-y-4 pt-1"
          >
            <FormInput
              name="full_name"
              control={control}
              label="Nombre completo"
              placeholder="Ej: María García"
              disabled={isSubmitting}
            />

            <FormInput
              name="email"
              control={control}
              label="Correo electrónico"
              placeholder="tu@correo.com"
              type="email"
              disabled={isSubmitting}
            />

            <FormInput
              name="phone"
              control={control}
              label="Teléfono (opcional)"
              placeholder="+58 412 000 0000"
              type="tel"
              disabled={isSubmitting}
            />
            <div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Procesando…
                  </>
                ) : (
                  "Continuar con el pedido"
                )}
              </Button>
              <p className="text-center text-sm text-gray-500">
                ¿Ya tienes cuenta?{" "}
                <Link
                  href="/auth/login"
                  className="text-primary font-medium hover:underline"
                  onClick={onClose}
                >
                  Inicia sesión
                </Link>
              </p>
            </div>
          </form>
        </Form>

      </DialogContent>
    </Dialog>
  );
}
