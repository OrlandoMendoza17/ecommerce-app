"use client";

import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/useToast";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormInput from "@/components/form/FormInput/FormInput";
import FormTextarea from "@/components/form/FormTextarea/FormTextarea";
import FormSelect from "@/components/form/FormSelect/FormSelect";
import FormFileInput from "@/components/form/FormFileInput/FormFileInput";
import FormSwitch from "@/components/form/FormSwitch/FormSwitch";
import { trpc } from "@/config/trpc.config";
import type { ProductsFormProps as Props, ProductForm } from "./ProductsForm.types";
import {
  defaultValues,
  NO_CATEGORY_VALUE,
  schema as productFormSchema,
  slugify,
} from "./ProductsForm.helpers";
import { useRouter } from "next/navigation";
import FormSection from "@/components/form/FormSection/FormSection";
import { uploadFiles } from "@/utils/supabase/storage/uploadFiles";
import ProductVariantsSection, {
  type ProductVariantsSectionHandle,
} from "./ProductVariantsSection";

const PRODUCTS_IMAGES_BUCKET = "products_images";

const CONDITION_OPTIONS = [
  { value: "new", label: "Nuevo" },
  { value: "used", label: "Usado" },
  { value: "refurbished", label: "Reacondicionado" },
];

export function ProductsForm(props: Props) {
  const { product } = props;
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const { toast, errorToast: onError } = useToast();
  const variantsSectionRef = useRef<ProductVariantsSectionHandle>(null);

  const { data: categories = [] } = trpc.categories.select.useQuery({
    is_active: undefined,
  });

  const form = useForm<ProductForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(productFormSchema) as any,
    defaultValues: {
      ...defaultValues,
      ...(product
        ? {
          name: product.name,
          slug: product.slug,
          description: product.description ?? "",
          brand: product.brand ?? "",
          condition: (product.condition as "new" | "used" | "refurbished") ?? "new",
          is_digital: product.is_digital ?? false,
          tags: product.tags ?? [],
          attributes: (product.attributes as Record<string, unknown>) ?? {},
          meta_title: product.meta_title ?? "",
          meta_description: product.meta_description ?? "",
          is_active: product.is_active ?? false,
          is_featured: product.is_featured ?? false,
          category_id: product.category_id ?? NO_CATEGORY_VALUE,
          image_files: [],
        }
        : {}),
    },
  });

  const { control, handleSubmit, watch, setValue } = form;
  const watchedValues = watch();

  const onSettled = () => setLoading(false);

  const insertMutation = trpc.products.insert.useMutation({ onError, onSettled });
  const updateMutation = trpc.products.update.useMutation({ onError, onSettled });

  const { mutateAsync: insertProduct } = insertMutation;
  const { mutateAsync: updateProduct } = updateMutation;

  const isEditMode = !!product;

  const onSubmit = handleSubmit(
    (async (data) => {
      setLoading(true);

      try {
        const slug = data.slug?.trim() || slugify(data.name);
        const category_id =
          data.category_id === NO_CATEGORY_VALUE ? null : data.category_id;

        const { image_files, category_id: _categoryId, ...formData } = data;

        const payload = {
          category_id,
          name: formData.name.trim(),
          slug,
          description: formData.description?.trim() ?? "",
          brand: formData.brand?.trim() ?? "",
          condition: formData.condition,
          is_digital: formData.is_digital,
          tags: formData.tags ?? [],
          attributes: formData.attributes ?? {},
          meta_title: formData.meta_title?.trim() ?? "",
          meta_description: formData.meta_description?.trim() ?? "",
          is_active: formData.is_active,
          is_featured: formData.is_featured,
        };

        if (isEditMode && product) {
          let images: string[] | undefined = undefined;

          if (image_files && image_files.length > 0) {
            images = await uploadFiles({
              files: image_files,
              folder: product.id,
              bucket: PRODUCTS_IMAGES_BUCKET,
            });
          }

          await updateProduct({
            ...payload,
            id: product.id,
            ...(images !== undefined ? { images } : {}),
          });

          // Save variants
          await variantsSectionRef.current?.saveVariants(product.id);

          toast({
            title: "Producto actualizado",
            description: "El producto se actualizó correctamente",
            variant: "success",
          });
          router.push("/admin/products");
        } else {
          const createdProduct = await insertProduct({
            ...payload,
            images: [],
          });

          if (!createdProduct?.id) throw new Error("No se pudo crear el producto");

          if (image_files && image_files.length > 0) {
            const uploadedUrls = await uploadFiles({
              files: image_files,
              folder: createdProduct.id,
              bucket: PRODUCTS_IMAGES_BUCKET,
            });

            if (uploadedUrls.length > 0) {
              await updateProduct({ id: createdProduct.id, images: uploadedUrls });
            }
          }

          // Save variants
          await variantsSectionRef.current?.saveVariants(createdProduct.id);

          toast({
            title: "Producto creado",
            description: "El producto se creó correctamente",
            variant: "success",
          });
          router.push("/admin/products");
        }
      } catch (error) {
        console.error("Error saving product:", error);
        onError(error as Error);
      } finally {
        setLoading(false);
      }
    }) as SubmitHandler<ProductForm>,
    () => {
      toast({
        title: "Error de validación",
        description: "Por favor corrige los errores en el formulario",
        variant: "error",
      });
    }
  );

  const handleNameBlur = () => {
    const name = watchedValues.name?.trim();
    const slug = watchedValues.slug?.trim();
    if (name && !slug) {
      setValue("slug", slugify(name), { shouldValidate: true });
    }
  };

  const handleTagsChange = (raw: string) => {
    const tags = raw.split(",").map((t) => t.trim()).filter(Boolean);
    setValue("tags", tags, { shouldValidate: true });
  };

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="px-4 pb-8">
        {/* ── Información básica ─────────────────────────────── */}
        <FormSection
          title="Información básica"
          description="Datos principales del producto"
        >
          <FormInput
            control={control}
            name="name"
            label="Nombre"
            placeholder="Ej. Camiseta de algodón"
            description="Nombre visible del producto"
            onBlur={handleNameBlur}
          />

          <FormInput
            control={control}
            name="slug"
            label="Slug"
            placeholder="camiseta-algodon"
            description="Identificador en la URL (se genera desde el nombre si lo dejas vacío)"
          />

          <FormSelect
            control={control}
            name="category_id"
            label="Categoría"
            description="Opcional. Asigna el producto a una categoría"
            placeholder="Sin categoría"
          >
            <FormSelect.Item value={NO_CATEGORY_VALUE}>
              Sin categoría
            </FormSelect.Item>
            {categories.map((item) => (
              <FormSelect.Item key={item.id} value={item.id}>
                {item.name}
              </FormSelect.Item>
            ))}
          </FormSelect>

          <FormTextarea
            control={control}
            name="description"
            label="Descripción"
            placeholder="Describe el producto..."
            rows={4}
          />
        </FormSection>

        {/* ── Detalles del catálogo ──────────────────────────── */}
        <FormSection
          title="Detalles del catálogo"
          description="Marca, condición y características adicionales"
        >
          <FormInput
            control={control}
            name="brand"
            label="Marca"
            placeholder="Ej. Nike, Genérica…"
          />

          <FormSelect
            control={control}
            name="condition"
            label="Condición"
            placeholder="Seleccionar…"
          >
            {CONDITION_OPTIONS.map((opt) => (
              <FormSelect.Item key={opt.value} value={opt.value}>
                {opt.label}
              </FormSelect.Item>
            ))}
          </FormSelect>

          <div className="space-y-1">
            <label className="text-sm font-medium">
              Etiquetas{" "}
              <span className="text-muted-foreground font-normal text-xs">
                (separadas por coma)
              </span>
            </label>
            <input
              type="text"
              defaultValue={(watchedValues.tags ?? []).join(", ")}
              onBlur={(e) => handleTagsChange(e.target.value)}
              placeholder="oferta, nuevo, verano…"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <FormSwitch
            control={control}
            name="is_digital"
            label="Producto digital"
            description="Sin inventario físico (software, cursos, descargas…)"
          />
        </FormSection>

        {/* ── Variantes e inventario ─────────────────────────── */}
        <FormSection
          title="Variantes e inventario"
          description="Opciones de producto (color, talla, etc.) y precio por variante"
        >
          <ProductVariantsSection
            ref={variantsSectionRef}
            productId={product?.id}
          />
        </FormSection>

        {/* ── SEO ────────────────────────────────────────────── */}
        <FormSection title="SEO" description="Metadatos para buscadores">
          <FormInput
            control={control}
            name="meta_title"
            label="Meta título"
            placeholder="Título para SEO"
          />

          <FormTextarea
            control={control}
            name="meta_description"
            label="Meta descripción"
            placeholder="Descripción para SEO"
            rows={2}
          />
        </FormSection>

        {/* ── Estado ─────────────────────────────────────────── */}
        <FormSection title="Estado" description="Visibilidad en la tienda">
          <FormSwitch
            control={control}
            name="is_active"
            label="Producto activo"
            description="Los productos inactivos no se muestran en la tienda"
          />

          <FormSwitch
            control={control}
            name="is_featured"
            label="Producto destacado"
            description="Mostrar en secciones destacadas"
          />
        </FormSection>

        {/* ── Imágenes ───────────────────────────────────────── */}
        <FormSection title="Imágenes" description="Galería del producto">
          <FormFileInput
            name="image_files"
            label="Imágenes del producto"
            description="JPG, PNG, GIF o WEBP. Máximo 5MB por archivo"
            folder={product?.id}
            bucket={PRODUCTS_IMAGES_BUCKET}
            multiple
            maxFiles={10}
            maxSize={5 * 1024 * 1024}
            accept={{ "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"] }}
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
              "Actualizar producto"
            ) : (
              "Crear producto"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default ProductsForm;
