"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, User } from "lucide-react";
import { Form } from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import FormInput from "@/components/form/FormInput/FormInput";
import { trpc } from "@/config/trpc.config";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { authAPI } from "@/lib/auth";

const profileFormSchema = z.object({
  full_name: z.string().min(1, { message: "El nombre es obligatorio" }),
  phone: z.string().min(1, { message: "El teléfono es obligatorio" }),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Formato inválido (AAAA-MM-DD)" })
    .optional()
    .or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileInfoCardProps {
  profile: Profile;
}

function profileToFormValues(profile: Profile): ProfileFormValues {
  return {
    full_name: profile.full_name ?? "",
    phone: profile.phone ?? "",
    date_of_birth: profile.date_of_birth ?? "",
  };
}

export default function ProfileInfoCard({ profile }: ProfileInfoCardProps) {
  const { setUser } = useAuth();
  const { toast, errorToast } = useToast();
  const utils = trpc.useUtils();

  const updateMutation = trpc.profiles.update.useMutation({
    onError: errorToast,
    onSuccess: async () => {
      await utils.profiles.getById.invalidate({ id: profile.id });
      toast({
        title: "Perfil actualizado",
        description: "Tu información personal fue guardada correctamente.",
        variant: "success",
      });
    },
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: profileToFormValues(profile),
  });

  const { control, handleSubmit, reset } = form;

  useEffect(() => {
    reset(profileToFormValues(profile));
  }, [profile, reset]);

  const onSubmit = handleSubmit(async (data) => {
    const payload = {
      full_name: data.full_name.trim(),
      phone: data.phone.trim(),
      date_of_birth: data.date_of_birth?.trim() || null,
    };

    try {
      const updatedUser = await authAPI.updateMetadata({
        full_name: payload.full_name,
        phone: payload.phone,
        date_of_birth: payload.date_of_birth ?? "",
      });
      if (updatedUser) setUser(updatedUser);
    } catch (error) {
      errorToast(error instanceof Error ? error : new Error(String(error)));
      return;
    }

    await updateMutation.mutateAsync({
      id: profile.id,
      ...payload,
    });
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle>Información personal</CardTitle>
            <CardDescription className="mt-0.5">
              Tu nombre, teléfono y fecha de nacimiento
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2.5">
              <p className="text-xs font-medium text-gray-500">
                Correo electrónico
              </p>
              <p className="mt-0.5 text-sm text-gray-900">{profile.email}</p>
            </div>

            <FormInput
              control={control}
              name="full_name"
              label="Nombre completo"
              placeholder="Juan Pérez"
            />

            <FormInput
              control={control}
              name="phone"
              label="Teléfono"
              placeholder="+58 412-1234567"
              type="tel"
            />

            <FormInput
              control={control}
              name="date_of_birth"
              label="Fecha de nacimiento"
              type="date"
              description="Opcional"
            />
          </form>
        </Form>
      </CardContent>

      <CardFooter className="justify-end border-t pt-6">
        <Button
          type="button"
          onClick={onSubmit}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Guardando...
            </span>
          ) : (
            "Guardar cambios"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
