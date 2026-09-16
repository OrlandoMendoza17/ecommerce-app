"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mail, Phone, User, Package, MapPin, Star } from "lucide-react";
import { trpc } from "@/config/trpc.config";
import { formatDate } from "@/lib/formatters/date";
import { formatPaidAmount } from "@/lib/formatters/currency";
import { getOrderStatusLabel } from "@/lib/order-status";
import { getFullName, getAge } from "@/lib/transformers/profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import FeatureHeader from "@/components/widgets/FeatureHeader/FeatureHeader";
import StarRating from "@/components/shared/StarRating/StarRating";
import {
  ADDRESSES_TO,
  EMPTY,
  PAGE_SIZE,
  byProfile,
  formatAddress,
  getPageRange,
  statusBadgeClass,
} from "./CustomerDetailView.helpers";
import type { CustomerDetailViewProps } from "./CustomerDetailView.types";

function SectionPager({
  page,
  pageSize,
  count,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  count: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(Math.ceil(count / pageSize), 1);
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, count);

  return (
    <div className="flex items-center justify-between gap-3 pt-3">
      <p className="text-xs text-muted-foreground">
        {from}–{to} de {count}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Anterior
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}

export default function CustomerDetailView({ profileId }: CustomerDetailViewProps) {
  const [ordersPage, setOrdersPage] = useState(1);
  const [reviewsPage, setReviewsPage] = useState(1);

  useEffect(() => {
    setOrdersPage(1);
    setReviewsPage(1);
  }, [profileId]);

  const filters = byProfile(profileId);
  const ordersRange = getPageRange(ordersPage);
  const reviewsRange = getPageRange(reviewsPage);

  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
  } = trpc.profiles.getByIdAdmin.useQuery({ id: profileId });

  const { data: ordersCount = 0 } = trpc.orders.count.useQuery({ filters });
  const { data: addressesCount = 0 } = trpc.addresses.count.useQuery({ filters });
  const { data: reviewsCount = 0 } = trpc.reviews.count.useQuery({ filters });

  const { data: orders = [], isLoading: ordersLoading } =
    trpc.orders.selectByRange.useQuery({
      filters,
      from: ordersRange.from,
      to: ordersRange.to,
    });

  const { data: addresses = [], isLoading: addressesLoading } =
    trpc.addresses.selectByRange.useQuery({
      filters,
      from: 0,
      to: ADDRESSES_TO,
    });

  const { data: reviews = [], isLoading: reviewsLoading } =
    trpc.reviews.selectByRange.useQuery({
      filters,
      from: reviewsRange.from,
      to: reviewsRange.to,
    });

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center space-y-4">
        <p className="text-muted-foreground">No se pudo cargar el cliente.</p>
        <Link href="/admin/customers" className="text-primary hover:underline text-sm">
          Volver a clientes
        </Link>
      </div>
    );
  }

  const displayName = getFullName(profile);
  const email = profile.email?.trim();
  const phone = profile.phone?.trim();
  const age = getAge(profile);
  const dobLabel = profile.date_of_birth?.trim()
    ? formatDate(profile.date_of_birth)
    : null;

  return (
    <div className="flex-1 overflow-y-auto bg-muted min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <FeatureHeader
          title={displayName}
          description="Consulta los datos, pedidos, direcciones y reseñas de este cliente."
          backUrl="/admin/customers"
        />

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <Avatar className="h-16 w-16 shrink-0">
              <AvatarImage
                className="object-cover"
                src={profile.avatar_url || undefined}
                alt={displayName}
              />
              <AvatarFallback>
                <User className="h-7 w-7" />
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold">{displayName}</h2>
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    profile.is_admin
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {profile.is_admin ? "Administrador" : "Cliente"}
                </span>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Email</dt>
                  <dd className="break-all">
                    {email ? (
                      <a
                        href={`mailto:${email}`}
                        className="inline-flex items-center gap-1.5 text-primary hover:underline"
                      >
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        {email}
                      </a>
                    ) : (
                      EMPTY
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Teléfono</dt>
                  <dd>
                    {phone ? (
                      <a
                        href={`tel:${phone}`}
                        className="inline-flex items-center gap-1.5 text-primary hover:underline"
                      >
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        {phone}
                      </a>
                    ) : (
                      EMPTY
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Fecha de nacimiento</dt>
                  <dd>
                    {dobLabel ? (
                      <span>
                        {dobLabel}
                        {age !== null ? (
                          <span className="text-muted-foreground"> ({age} años)</span>
                        ) : null}
                      </span>
                    ) : (
                      EMPTY
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Fecha de registro</dt>
                  <dd>
                    {profile.created_at ? formatDate(profile.created_at) : EMPTY}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px overflow-hidden rounded-xl border border-border bg-border">
          <div className="bg-card px-5 py-4">
            <p className="text-xs text-muted-foreground mb-1">Pedidos</p>
            <p className="text-xl font-semibold tabular-nums">{ordersCount}</p>
          </div>
          <div className="bg-card px-5 py-4">
            <p className="text-xs text-muted-foreground mb-1">Direcciones</p>
            <p className="text-xl font-semibold tabular-nums">{addressesCount}</p>
          </div>
          <div className="bg-card px-5 py-4">
            <p className="text-xs text-muted-foreground mb-1">Reseñas</p>
            <p className="text-xl font-semibold tabular-nums">{reviewsCount}</p>
          </div>
        </div>

        <section className="bg-card rounded-xl border border-border p-5 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            Pedidos
          </h2>
          {ordersLoading ? (
            <p className="text-sm text-muted-foreground">Cargando pedidos…</p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin pedidos</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <th className="py-2 pr-3">Nº</th>
                    <th className="py-2 pr-3">Fecha</th>
                    <th className="py-2 pr-3">Estado</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/20">
                      <td className="py-3 pr-3">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-mono font-medium text-primary hover:underline"
                        >
                          #{order.order_number?.trim() || EMPTY}
                        </Link>
                      </td>
                      <td className="py-3 pr-3 text-muted-foreground whitespace-nowrap">
                        {order.created_at ? formatDate(order.created_at) : EMPTY}
                      </td>
                      <td className="py-3 pr-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(order.status)}`}
                        >
                          {getOrderStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="py-3 text-right tabular-nums font-medium">
                        {formatPaidAmount(
                          order.paid_total,
                          order.payment_currency,
                          order.subtotal
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <SectionPager
            page={ordersPage}
            pageSize={PAGE_SIZE}
            count={ordersCount}
            onPageChange={setOrdersPage}
          />
        </section>

        <section className="bg-card rounded-xl border border-border p-5 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            Direcciones
          </h2>
          {addressesLoading ? (
            <p className="text-sm text-muted-foreground">Cargando direcciones…</p>
          ) : addresses.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin direcciones</p>
          ) : (
            <ul className="space-y-3">
              {addresses.map((address) => (
                <li
                  key={address.id}
                  className="rounded-lg border border-border px-4 py-3 space-y-1"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">
                      {address.full_name?.trim() || EMPTY}
                    </p>
                    {address.is_default ? (
                      <span className="inline-flex rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">
                        Predeterminada
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {formatAddress(address) || EMPTY}
                  </p>
                  {address.phone?.trim() ? (
                    <p className="text-xs text-muted-foreground">{address.phone}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-card rounded-xl border border-border p-5 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Star className="h-4 w-4 text-muted-foreground" />
            Reseñas
          </h2>
          {reviewsLoading ? (
            <p className="text-sm text-muted-foreground">Cargando reseñas…</p>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin reseñas</p>
          ) : (
            <ul className="divide-y divide-border">
              {reviews.map((review) => {
                const productHref = review.product_slug
                  ? `/productos/${review.product_slug}`
                  : null;
                const productName = review.product_name?.trim() || "Producto";
                const title = review.title?.trim();

                return (
                  <li key={review.id} className="py-3 first:pt-0 last:pb-0 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {productHref ? (
                        <Link
                          href={productHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium hover:underline"
                        >
                          {productName}
                        </Link>
                      ) : (
                        <span className="text-sm font-medium">{productName}</span>
                      )}
                      <span
                        className={
                          review.is_approved
                            ? "inline-flex rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success"
                            : "inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground"
                        }
                      >
                        {review.is_approved ? "Aprobada" : "Oculta"}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <StarRating value={review.rating} size="sm" readOnly />
                      <span className="text-xs text-muted-foreground">
                        {review.created_at ? formatDate(review.created_at) : EMPTY}
                      </span>
                    </div>
                    {title ? (
                      <p className="text-sm text-muted-foreground line-clamp-2">{title}</p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
          <SectionPager
            page={reviewsPage}
            pageSize={PAGE_SIZE}
            count={reviewsCount}
            onPageChange={setReviewsPage}
          />
        </section>
      </div>
    </div>
  );
}
