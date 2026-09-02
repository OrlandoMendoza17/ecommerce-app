"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Package } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { trpc } from "@/config/trpc.config";
import { useToast } from "@/hooks/useToast";
import StarRating from "@/components/shared/StarRating/StarRating";
import { schema, defaultValues } from "./ReviewFormView.helpers";
import type { ReviewFormViewProps, ReviewFormValues } from "./ReviewFormView.types";

const MAX_COMMENT = 1500;

export default function ReviewFormView({ id }: ReviewFormViewProps) {
  const router = useRouter();
  const { toast, errorToast } = useToast();
  const [deleting, setDeleting] = useState(false);

  const { data: review, isLoading, isError } = trpc.reviews.getById.useQuery(
    { id },
    { retry: false }
  );

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const { control, handleSubmit, watch, setValue, formState } = form;
  const watchedComment = watch("comment") ?? "";
  const watchedRating = watch("rating");

  // Populate form once review is loaded
  useEffect(() => {
    if (review) {
      setValue("rating", review.rating);
      setValue("title", review.title ?? "");
      setValue("comment", review.comment ?? "");
    }
  }, [review, setValue]);

  const utils = trpc.useUtils();

  const updateMutation = trpc.reviews.update.useMutation({
    onError: errorToast,
  });

  const deleteMutation = trpc.reviews.delete.useMutation({
    onError: errorToast,
  });

  const onSubmit = handleSubmit(async (data: ReviewFormValues) => {
    await updateMutation.mutateAsync({
      id,
      rating: data.rating,
      title: data.title ?? "",
      comment: data.comment ?? "",
    });
    await utils.reviews.invalidate();
    toast({
      title: "Opinión guardada",
      description: "Tu reseña se actualizó correctamente",
      variant: "success",
    });
    router.push("/mis-opiniones?tab=COMPLETED");
  });

  async function handleDelete() {
    if (!confirm("¿Estás seguro de que deseas eliminar esta opinión?")) return;
    setDeleting(true);
    try {
      await deleteMutation.mutateAsync({ id });
      await utils.reviews.invalidate();
      toast({
        title: "Opinión eliminada",
        variant: "success",
      });
      router.push("/mis-opiniones?tab=PENDING");
    } catch {
      // handled by onError
    } finally {
      setDeleting(false);
    }
  }

  // ── Loading / error states ──────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !review) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <Package className="h-16 w-16 text-gray-300 mx-auto" />
        <p className="text-gray-600">No se encontró la reseña.</p>
        <Button variant="outline" onClick={() => router.back()}>
          Volver
        </Button>
      </div>
    );
  }

  const isSaving = formState.isSubmitting;

  return (
    <div className="max-w-lg mx-auto px-4 py-10 space-y-4">
      {/* Product card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center gap-3 text-center">
        <Avatar className="h-20 w-20 rounded-full">
          <AvatarImage
            className="object-cover"
            src={review.product_image_url || undefined}
            alt={review.product_name}
          />
          <AvatarFallback className="rounded-full">
            <Package className="h-8 w-8 text-gray-400" />
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-base font-semibold text-gray-900">
            ¿Qué te pareció tu producto?
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{review.product_name}</p>
        </div>
        <StarRating
          value={watchedRating}
          size="lg"
          onChange={(v) => setValue("rating", v, { shouldValidate: true })}
        />
        {formState.errors.rating && (
          <p className="text-xs text-destructive">
            {formState.errors.rating.message}
          </p>
        )}
      </div>

      {/* Comment card */}
      <Form {...form}>
        <form onSubmit={onSubmit}>
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-base font-semibold text-gray-900 text-center">
              Cuéntanos más acerca de tu producto
            </h2>

            <FormField
              control={control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <textarea
                      {...field}
                      maxLength={MAX_COMMENT}
                      rows={5}
                      placeholder="Mi producto me pareció..."
                      className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground text-right">
                    {watchedComment.length} / {MAX_COMMENT}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col items-center gap-3 mt-6">
            <Button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto px-10"
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </span>
              ) : (
                "Guardar"
              )}
            </Button>
            <button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              className="text-sm text-primary hover:underline disabled:opacity-50"
            >
              {deleting ? "Eliminando..." : "Eliminar opinión"}
            </button>
          </div>
        </form>
      </Form>
    </div>
  );
}
