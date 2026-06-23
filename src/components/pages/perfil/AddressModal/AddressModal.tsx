"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Form } from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import FormInput from "@/components/form/FormInput/FormInput";
import FormSwitch from "@/components/form/FormSwitch/FormSwitch";
import { trpc } from "@/config/trpc.config";
import { useToast } from "@/hooks/useToast";

const addressFormSchema = z.object({
  full_name: z.string().min(1, { message: "El nombre es obligatorio" }),
  phone: z.string().min(1, { message: "El teléfono es obligatorio" }),
  address_line1: z.string().min(1, { message: "La dirección es obligatoria" }),
  address_line2: z.string().optional(),
  city: z.string().min(1, { message: "La ciudad es obligatoria" }),
  state: z.string().min(1, { message: "El estado es obligatorio" }),
  postal_code: z.string().optional(),
  country: z.string().optional(),
  is_default: z.boolean(),
});

type AddressFormValues = z.infer<typeof addressFormSchema>;

function addressToFormValues(address: Address): AddressFormValues {
  return {
    full_name: address.full_name ?? "",
    phone: address.phone ?? "",
    address_line1: address.address_line1 ?? "",
    address_line2: address.address_line2 ?? "",
    city: address.city ?? "",
    state: address.state ?? "",
    postal_code: address.postal_code ?? "",
    country: address.country ?? "Venezuela",
    is_default: address.is_default ?? false,
  };
}

const defaultValues: AddressFormValues = {
  full_name: "",
  phone: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "Venezuela",
  is_default: false,
};

interface AddressModalProps {
  children: React.ReactNode;
  address?: Address;
}

export default function AddressModal({ children, address }: AddressModalProps) {
  const [open, setOpen] = useState(false);
  const isEditing = !!address;
  const { toast, errorToast } = useToast();
  const utils = trpc.useUtils();

  const insertMutation = trpc.addresses.insert.useMutation({
    onError: errorToast,
    onSuccess: async () => {
      await utils.addresses.listMine.invalidate();
      toast({
        title: "Dirección agregada",
        description: "Tu nueva dirección fue guardada correctamente.",
        variant: "success",
      });
      setOpen(false);
    },
  });

  const updateMutation = trpc.addresses.update.useMutation({
    onError: errorToast,
    onSuccess: async () => {
      await utils.addresses.listMine.invalidate();
      toast({
        title: "Dirección actualizada",
        description: "Los cambios fueron guardados correctamente.",
        variant: "success",
      });
      setOpen(false);
    },
  });

  const isPending = insertMutation.isPending || updateMutation.isPending;

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: address ? addressToFormValues(address) : defaultValues,
  });

  const { control, handleSubmit, reset } = form;

  useEffect(() => {
    if (open) {
      reset(address ? addressToFormValues(address) : defaultValues);
    }
  }, [open, address, reset]);

  const onSubmit = handleSubmit(async (data) => {
    if (isEditing && address) {
      await updateMutation.mutateAsync({
        id: address.id,
        full_name: data.full_name.trim(),
        phone: data.phone.trim(),
        address_line1: data.address_line1.trim(),
        address_line2: data.address_line2?.trim() ?? "",
        city: data.city.trim(),
        state: data.state.trim(),
        postal_code: data.postal_code?.trim() ?? "",
        country: data.country?.trim() || "Venezuela",
        is_default: data.is_default,
      });
    } else {
      await insertMutation.mutateAsync({
        full_name: data.full_name.trim(),
        phone: data.phone.trim(),
        address_line1: data.address_line1.trim(),
        address_line2: data.address_line2?.trim() ?? "",
        city: data.city.trim(),
        state: data.state.trim(),
        postal_code: data.postal_code?.trim() ?? "",
        country: data.country?.trim() || "Venezuela",
        is_default: data.is_default,
      });
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className={[
          "gap-4 overflow-y-auto overscroll-contain scrollbar-none [&::-webkit-scrollbar]:hidden p-6 sm:max-w-lg",
          "max-h-[calc(100dvh-2rem)]",
          "top-4 left-[50%] -translate-x-1/2 translate-y-0 sm:top-[50%] sm:-translate-y-1/2",
          "max-[424px]:inset-x-0 max-[424px]:top-0 max-[424px]:left-0 max-[424px]:max-h-dvh max-[424px]:w-full max-[424px]:max-w-full max-[424px]:translate-x-0 max-[424px]:translate-y-0 max-[424px]:rounded-none max-[424px]:border-x-0",
        ].join(" ")}
      >
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar dirección" : "Nueva dirección"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los datos de esta dirección de entrega."
              : "Agrega una dirección de entrega a tu cuenta."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id="address-form"
            className="space-y-4 py-1"
            onSubmit={onSubmit}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormInput
                control={control}
                name="full_name"
                label="Nombre completo"
                placeholder="Juan Pérez"
                wrapperClassName="sm:col-span-2"
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
                name="country"
                label="País"
                placeholder="Venezuela"
              />

              <FormInput
                control={control}
                name="address_line1"
                label="Dirección"
                placeholder="Av. Principal, Casa 12"
                wrapperClassName="sm:col-span-2"
              />

              <FormInput
                control={control}
                name="address_line2"
                label="Dirección (línea 2)"
                placeholder="Urb. El Bosque, Piso 3"
                description="Opcional"
                wrapperClassName="sm:col-span-2"
              />

              <FormInput
                control={control}
                name="city"
                label="Ciudad"
                placeholder="Caracas"
              />

              <FormInput
                control={control}
                name="state"
                label="Estado"
                placeholder="Distrito Capital"
              />

              <FormInput
                control={control}
                name="postal_code"
                label="Código postal"
                placeholder="1060"
                description="Opcional"
              />
            </div>

            <FormSwitch
              control={control}
              name="is_default"
              label="Dirección predeterminada"
              description="Se usará automáticamente al realizar un pedido"
            />
          </form>
        </Form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="address-form"
            disabled={isPending}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </span>
            ) : isEditing ? (
              "Guardar cambios"
            ) : (
              "Agregar dirección"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
