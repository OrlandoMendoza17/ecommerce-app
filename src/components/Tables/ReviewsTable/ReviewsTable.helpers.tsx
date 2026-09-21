"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TableFiltersColumn } from "@/components/global/Table/Table.types";
import { Table } from "@/components/global/Table/Table";
import { formatDate } from "@/lib/formatters/date";
import { Package, Check, EyeOff } from "lucide-react";
import { trpc } from "@/config/trpc.config";
import { useToast } from "@/hooks/useToast";
import { FaXmark } from "react-icons/fa6";
import { Separator } from "@/components/ui/separator";
import StarRating from "@/components/shared/StarRating/StarRating";
import { ActiveStatusBadge } from "@/components/shared/StatusBadge";

const EMPTY_CELL_PLACEHOLDER = "-";

const TableCellPlaceholder = () => (
  <span className="text-sm text-muted-foreground">{EMPTY_CELL_PLACEHOLDER}</span>
);

const formatCreatedAt = (createdAt?: string | null) => {
  if (!createdAt || Number.isNaN(new Date(createdAt).getTime())) {
    return null;
  }
  return formatDate(createdAt);
};

export const columns: ColumnDef<ReviewAdminItem>[] = [
  {
    id: "product",
    header: "Producto",
    cell: ({ row }) => {
      const review = row.original;
      const name = review.product_name?.trim() || "Producto";
      const href = review.product_slug
        ? `/productos/${review.product_slug}`
        : null;
      const content = (
        <div className="flex min-w-40 items-center gap-3">
          <Avatar className="size-10 rounded-lg shrink-0">
            <AvatarImage
              className="object-cover"
              src={review.product_image_url || undefined}
              alt={name}
            />
            <AvatarFallback className="rounded-lg">
              <Package className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium line-clamp-2">{name}</span>
        </div>
      );

      if (!href) return content;

      return (
        <Link
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
          title="Ver en tienda"
        >
          {content}
        </Link>
      );
    },
  },
  {
    id: "customer",
    header: "Cliente",
    cell: ({ row }) => {
      const name = row.original.customer_name?.trim() || "Sin nombre";
      const email = row.original.customer_email?.trim();
      const profileId = row.original.profile_id;
      return (
        <div className="flex min-w-35 flex-col">
          {profileId ? (
            <Link
              href={`/admin/customers/${profileId}`}
              className="text-sm font-medium hover:underline"
            >
              {name}
            </Link>
          ) : (
            <span className="text-sm font-medium">{name}</span>
          )}
          {email ? (
            <span className="text-xs text-muted-foreground">{email}</span>
          ) : null}
        </div>
      );
    },
  },
  {
    accessorKey: "rating",
    header: "Rating",
    cell: ({ row }) => (
      <StarRating value={row.original.rating} size="sm" readOnly />
    ),
  },
  {
    accessorKey: "comment",
    header: "Comentario",
    cell: ({ row }) => {
      const title = row.original.title?.trim();
      const comment = row.original.comment?.trim();
      if (!title && !comment) return <TableCellPlaceholder />;
      const preview = comment || title;
      return (
        <p
          className="line-clamp-2 max-w-60 text-sm text-muted-foreground"
          title={[title, comment].filter(Boolean).join(" — ")}
        >
          {preview}
        </p>
      );
    },
  },
  {
    accessorKey: "is_approved",
    header: "Estado",
    cell: ({ row }) => (
      <ActiveStatusBadge
        active={row.original.is_approved}
        activeLabel="Aprobada"
        inactiveLabel="Oculta"
      />
    ),
  },
  {
    accessorKey: "created_at",
    header: "Fecha",
    cell: ({ row }) => {
      const label = formatCreatedAt(row.original.created_at);
      if (!label) return <TableCellPlaceholder />;
      return <span className="text-sm">{label}</span>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ReviewRowActions review={row.original} />,
  },
];

function ReviewRowActions({ review }: { review: ReviewAdminItem }) {
  const utils = trpc.useUtils();
  const { toast, errorToast } = useToast();
  const setApproved = trpc.reviews.setApproved.useMutation({
    onError: errorToast,
  });
  const entity = "Reseña";
  const displayName =
    review.product_name?.trim() || review.title?.trim() || review.id;
  const isApproved = review.is_approved;

  return (
    <div className="flex justify-center">
      <Table.RowActions>
        <Table.RowActions.Click
          title={isApproved ? "Ocultar" : "Aprobar"}
          icon={
            isApproved ? (
              <EyeOff className="size-4" />
            ) : (
              <Check className="size-4" />
            )
          }
          onClick={() => {
            setApproved.mutate(
              { id: review.id, is_approved: !isApproved },
              {
                onSuccess: () => {
                  utils.reviews.invalidate();
                  toast({
                    title: isApproved ? "Reseña oculta" : "Reseña aprobada",
                    description: isApproved ? "La reseña ha sido oculta" : "La reseña ha sido aprobada",
                    variant: "success",
                  });
                },
              }
            );
          }}
        />
        <Separator />
        <Table.RowActions.Delete
          id={review.id}
          name={displayName}
          entity={entity}
          title="Eliminar reseña"
          Icon={FaXmark}
          mutation={trpc.reviews.deleteAdmin}
          onDeleteSuccess={utils.reviews.invalidate}
        />
      </Table.RowActions>
    </div>
  );
}

export const filterColumns: TableFiltersColumn[] = [
  {
    label: "is_approved",
    displayLabel: "Estado",
    type: "select",
    options: [
      { value: "true", label: "Aprobada" },
      { value: "false", label: "Oculta" },
    ],
  },
  {
    label: "rating",
    displayLabel: "Rating",
    type: "select",
    options: [
      { value: "5", label: "5 estrellas" },
      { value: "4", label: "4 estrellas" },
      { value: "3", label: "3 estrellas" },
      { value: "2", label: "2 estrellas" },
      { value: "1", label: "1 estrella" },
    ],
  },
  {
    label: "created_at",
    displayLabel: "Fecha",
    type: "date",
  },
];
