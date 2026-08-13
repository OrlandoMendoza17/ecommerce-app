"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/useToast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormInput from "@/components/form/FormInput/FormInput";
import FormFileInput from "@/components/form/FormFileInput/FormFileInput";
import FormSwitch from "@/components/form/FormSwitch/FormSwitch";
import { trpc } from "@/config/trpc.config";
import type { BrandsFormProps as Props, BrandForm } from "./BrandsForm.types";
import { defaultValues, schema as brandFormSchema } from "./BrandsForm.helpers";
import { useRouter } from "next/navigation";
import FormSection from "@/components/form/FormSection/FormSection";
import { uploadFiles } from "@/utils/supabase/storage/uploadFiles";

const BRANDS_IMAGES_BUCKET = "brands_images";

export function BrandsForm(props: Props) {
  const { brand } = props;
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast, errorToast: onError } = useToast();

  const form = useForm<BrandForm>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: {
      ...defaultValues,
      ...(brand
        ? {
            name: brand.name,
            display_order: brand.display_order,
            is_active: brand.is_active,
          }
        : {}),
      image_url: brand?.image_url ? [brand.image_url] : [],
    },
  });

  const { control, handleSubmit, watch, setValue } = form;
  const watchedValues = watch();

  const onSettled = () => setLoading(false);

  const insertMutation = trpc.brands.insert.useMutation({ onError, onSettled });
  const updateMutation = trpc.brands.update.useMutation({ onError, onSettled });

  const { mutateAsync: insertBrand } = insertMutation;
  const { mutateAsync: updateBrand } = updateMutation;

  const isEditMode = !!brand;

  const onSubmit = handleSubmit(
    async (data: BrandForm) => {
      setLoading(true);

      try {
        const existingUrls: string[] = data.image_url.filter(
          (item): item is string => typeof item === "string"
        );
        const newFiles: File[] = data.image_url.filter(
          (item): item is File => item instanceof File
        );

        let finalImageUrl = "";

        if (newFiles.length > 0 && isEditMode && brand) {
          const uploadedUrls = await uploadFiles({
            files: newFiles,
            folder: brand.id,
            bucket: BRANDS_IMAGES_BUCKET,
          });
          if (uploadedUrls.length > 0) finalImageUrl = uploadedUrls[0];
        } else if (existingUrls.length > 0) {
          finalImageUrl = existingUrls[0];
        }

        const payload = {
          name: data.name.trim(),
          display_order: data.display_order,
          is_active: data.is_active,
          image_url: finalImageUrl,
        };

        if (isEditMode && brand) {
          await updateBrand({ ...payload, id: brand.id });
          toast({
            title: "Marca actualizada",
            description: "La marca se actualizó correctamente",
            variant: "success",
          });
          router.push("/admin/brands");
        } else {
          const createdBrand = await insertBrand(payload);

          if (newFiles.length > 0 && createdBrand?.id) {
            const uploadedUrls = await uploadFiles({
              files: newFiles,
              folder: createdBrand.id,
              bucket: BRANDS_IMAGES_BUCKET,
            });
            if (uploadedUrls.length > 0) {
              await updateBrand({
                id: createdBrand.id,
                image_url: uploadedUrls[0],
              });
            }
          }

          toast({
            title: "Marca creada",
            description: "La marca se creó correctamente",
            variant: "success",
          });
          router.push("/admin/brands");
        }
      } catch (error) {
        console.error("Error saving brand:", error);
        onError(error as Error);
      } finally {
        setLoading(false);
      }
    },
    () => {
      toast({
        title: "Error de validación",
        description: "Por favor corrige los errores en el formulario",
        variant: "error",
      });
    }
  );

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="px-4 pb-8">
        <FormSection
          title="Información básica"
          description="Datos principales de la marca"
        >
          <FormInput
            control={control}
            name="name"
            label="Nombre"
            placeholder="Ej. Nike"
            description="Nombre visible de la marca"
          />

          <FormInput
            control={control}
            name="display_order"
            label="Orden de visualización"
            type="number"
            placeholder="0"
            description="Menor número aparece primero en listados"
          />

          <FormSwitch
            control={control}
            name="is_active"
            label="Marca activa"
            description="Las marcas inactivas no se muestran en la tienda"
          />
        </FormSection>

        <FormSection
          title="Imagen"
          description="Logo o imagen representativa de la marca"
        >
          <FormFileInput
            name="image_url"
            label="Imagen de la marca"
            description="JPG, PNG, GIF o WEBP. Máximo 1MB"
            folder={brand?.id}
            bucket={BRANDS_IMAGES_BUCKET}
            multiple={false}
            maxFiles={1}
            maxSize={1024 * 1024}
            accept={{ "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"] }}
            handleDrop={(acceptedFiles) => {
              if (acceptedFiles.length > 0) {
                setValue("image_url", [acceptedFiles[0]]);
              }
            }}
          />
        </FormSection>

        <div className="flex justify-end space-x-2 pt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading || !watchedValues.name?.trim()}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {isEditMode ? "Actualizando..." : "Creando..."}
              </div>
            ) : isEditMode ? (
              "Actualizar marca"
            ) : (
              "Crear marca"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default BrandsForm;
