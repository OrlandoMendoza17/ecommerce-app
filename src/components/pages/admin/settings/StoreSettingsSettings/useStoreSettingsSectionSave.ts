"use client";

import { useState } from "react";
import { trpc } from "@/config/trpc.config";
import { useToast } from "@/hooks/useToast";

export function useStoreSettingsSectionSave(successDescription: string) {
  const [loading, setLoading] = useState(false);
  const { toast, errorToast } = useToast();
  const utils = trpc.useUtils();

  const updateMutation = trpc.storeSettings.update.useMutation({
    onSuccess: async () => {
      await utils.storeSettings.get.invalidate();
      toast({
        title: "Configuración guardada",
        description: successDescription,
        variant: "success",
      });
    },
    onError: errorToast,
    onSettled: () => setLoading(false),
  });

  const save = async (payload: Parameters<typeof updateMutation.mutateAsync>[0]) => {
    setLoading(true);
    await updateMutation.mutateAsync(payload);
  };

  const onValidationError = () => {
    toast({
      title: "Error de validación",
      description: "Por favor corrige los errores en el formulario",
      variant: "error",
    });
  };

  return { save, loading, onValidationError };
}
