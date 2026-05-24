"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/useToast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormInput from "@/components/form/FormInput/FormInput";
import FormTextarea from "@/components/form/FormTextarea/FormTextarea";
import FormSelect from "@/components/form/FormSelect/FormSelect";
import FormFileInput from "@/components/form/FormFileInput/FormFileInput";
import FormSwitch from "@/components/form/FormSwitch/FormSwitch";
import { trpc } from "@/config/trpc.config";
import type {
  CategoriesFormProps as Props,
  CategoryForm,
} from "./CategoriesForm.types";
import {
  defaultValues,
  NO_PARENT_VALUE,
  schema as categoryFormSchema,
  slugify,
} from "./CategoriesForm.helpers";
import { useRouter } from "next/navigation";
import FormSection from "@/components/form/FormSection/FormSection";
import { uploadFiles } from "@/utils/supabase/storage/uploadFiles";

const CATEGORIES_IMAGES_BUCKET = "categories_images";

export function CategoriesForm(props: Props) {
  const { category } = props;
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const { toast, errorToast: onError } = useToast();

  const { data: parentCategories = [] } = trpc.categories.select.useQuery({
    is_active: undefined,
  });

  const form = useForm<CategoryForm>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      ...defaultValues,
      ...(category),
      image_url: category?.image_url ? [category.image_url] : [],
    },
  });

  const { control, handleSubmit, watch, setValue } = form;
  const watchedValues = watch();

  const onSettled = () => setLoading(false);

  const insertMutation = trpc.categories.insert.useMutation({ onError, onSettled });
  const updateMutation = trpc.categories.update.useMutation({ onError, onSettled });

  const { mutateAsync: insertCategory } = insertMutation;
  const { mutateAsync: updateCategory } = updateMutation;

  const isEditMode = !!category;

  const parentOptions = parentCategories.filter(
    (item) => !category || item.id !== category.id,
  );

  const onSubmit = handleSubmit(
    async (data: CategoryForm) => {
      setLoading(true);

      try {
        const existingUrls: string[] = data.image_url.filter(
          (item): item is string => typeof item === "string",
        );
        const newFiles: File[] = data.image_url.filter(
          (item): item is File => item instanceof File,
        );

        let finalImageUrl = "";

        if (newFiles.length > 0 && isEditMode && category) {
          const uploadedUrls = await uploadFiles({
            files: newFiles,
            folder: category.id,
            bucket: CATEGORIES_IMAGES_BUCKET,
          });
          if (uploadedUrls.length > 0) finalImageUrl = uploadedUrls[0];
        } else if (existingUrls.length > 0) {
          finalImageUrl = existingUrls[0];
        }

        const slug = data.slug?.trim() || slugify(data.name);

        const payload = {
          name: data.name.trim(),
          slug,
          description: data.description?.trim() ?? "",
          parent_id: null,
          display_order: data.display_order,
          is_active: data.is_active,
          image_url: finalImageUrl,
        };

        if (isEditMode && category) {
          await updateCategory({ ...payload, id: category.id });
          toast({
            title: "Categoría actualizada",
            description: "La categoría se actualizó correctamente",
            variant: "success",
          });
          router.push("/admin/categories");
        } else {
          const createdCategory = await insertCategory(payload);

          if (newFiles.length > 0 && createdCategory?.id) {
            const uploadedUrls = await uploadFiles({
              files: newFiles,
              folder: createdCategory.id,
              bucket: CATEGORIES_IMAGES_BUCKET,
            });
            if (uploadedUrls.length > 0) {
              await updateCategory({
                id: createdCategory.id,
                image_url: uploadedUrls[0],
              });
            }
          }

          toast({
            title: "Categoría creada",
            description: "La categoría se creó correctamente",
            variant: "success",
          });
          router.push("/admin/categories");
        }
      } catch (error) {
        console.error("Error saving category:", error);
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
    },
  );

  const handleNameBlur = () => {
    const name = watchedValues.name?.trim();
    const slug = watchedValues.slug?.trim();
    if (name && !slug) {
      setValue("slug", slugify(name), { shouldValidate: true });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="px-4 pb-8">
        <FormSection
          title="Información básica"
          description="Datos principales de la categoría"
        >
          <FormInput
            control={control}
            name="name"
            label="Nombre"
            placeholder="Ej. Camisetas"
            description="Nombre visible de la categoría"
            onBlur={handleNameBlur}
          />

          <FormInput
            control={control}
            name="slug"
            label="Slug"
            placeholder="camisetas"
            description="Identificador en la URL (se genera desde el nombre si lo dejas vacío)"
          />

          <FormTextarea
            control={control}
            name="description"
            label="Descripción"
            placeholder="Describe brevemente la categoría..."
            rows={3}
            description="Texto opcional para identificar la categoría"
          />
        </FormSection>

        <FormSection
          title="Jerarquía y orden"
          description="Categoría padre y posición en el catálogo"
        >
          <FormSelect
            control={control}
            name="parent_id"
            label="Categoría padre"
            description="Opcional. Deja sin padre para una categoría raíz"
            placeholder="Sin categoría padre"
          >
            <FormSelect.Item value={NO_PARENT_VALUE}>
              Sin categoría padre
            </FormSelect.Item>
            {parentOptions.map((item) => (
              <FormSelect.Item key={item.id} value={item.id}>
                {item.name}
              </FormSelect.Item>
            ))}
          </FormSelect>

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
            label="Categoría activa"
            description="Las categorías inactivas no se muestran en la tienda"
          />
        </FormSection>

        <FormSection
          title="Imagen"
          description="Imagen representativa de la categoría"
        >
          <FormFileInput
            name="image_url"
            label="Imagen de la categoría"
            description="JPG, PNG, GIF o WEBP. Máximo 1MB"
            folder={category?.id}
            bucket={CATEGORIES_IMAGES_BUCKET}
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
              "Actualizar categoría"
            ) : (
              "Crear categoría"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default CategoriesForm;
