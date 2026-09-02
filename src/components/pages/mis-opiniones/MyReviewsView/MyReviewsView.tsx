"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Star, Package } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { trpc } from "@/config/trpc.config";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import StarRating from "@/components/shared/StarRating/StarRating";

const PAGE_SIZE = 10;
const TABS = ["PENDING", "COMPLETED"] as const;
type Tab = (typeof TABS)[number];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-VE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function PaginationText({
  from,
  to,
  total,
  tab,
}: {
  from: number;
  to: number;
  total: number;
  tab: Tab;
}) {
  if (total === 0) return null;
  const label =
    tab === "PENDING" ? "opiniones pendientes" : "opiniones realizadas";
  const end = Math.min(to, total - 1);
  return (
    <span className="text-sm text-gray-500">
      {from + 1} - {end + 1} de {total} {label}
    </span>
  );
}

export default function MyReviewsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab")?.toUpperCase();
  const activeTab: Tab =
    rawTab === "COMPLETED" ? "COMPLETED" : "PENDING";

  const { user, rendered } = useAuth();
  const { errorToast } = useToast();

  // Pagination state – stored in URL via page param for shareability
  const rawPage = Number(searchParams.get("page") ?? "1");
  const page = Math.max(1, isNaN(rawPage) ? 1 : rawPage);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  function setPage(next: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(next));
    router.push(`/mis-opiniones?${params.toString()}`);
  }

  function setTab(tab: Tab) {
    router.push(`/mis-opiniones?tab=${tab}&page=1`);
  }

  // Pending
  const { data: pendingCount = 0 } = trpc.reviews.countPending.useQuery(
    undefined,
    { enabled: !!user }
  );
  const { data: pendingItems = [], isLoading: pendingLoading } =
    trpc.reviews.listPending.useQuery(
      { from, to },
      { enabled: !!user && activeTab === "PENDING" }
    );

  // Completed
  const { data: completedCount = 0 } = trpc.reviews.countCompleted.useQuery(
    undefined,
    { enabled: !!user }
  );
  const { data: completedItems = [], isLoading: completedLoading } =
    trpc.reviews.listCompleted.useQuery(
      { from, to },
      { enabled: !!user && activeTab === "COMPLETED" }
    );

  const utils = trpc.useUtils();

  const insertMutation = trpc.reviews.insert.useMutation({
    onError: errorToast,
  });

  async function handleQuickCreate(
    item: ReviewPendingItem,
    rating: number
  ) {
    try {
      const result = await insertMutation.mutateAsync({
        product_id: item.product_id,
        order_id: item.order_id,
        rating,
      });
      await utils.reviews.invalidate();
      router.push(`/mis-opiniones/${result.id}`);
    } catch {
      // error shown by onError
    }
  }

  // ── Loading / auth gates ──────────────────────────────────────────────
  if (!rendered) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <Star className="h-16 w-16 text-gray-300 mx-auto" />
        <h1 className="text-xl font-bold text-gray-900">Mis opiniones</h1>
        <p className="text-gray-600">
          Inicia sesión para ver y gestionar tus reseñas.
        </p>
        <Link
          href="/auth/login"
          className="inline-flex bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  const isLoading =
    activeTab === "PENDING" ? pendingLoading : completedLoading;
  const totalCount =
    activeTab === "PENDING" ? pendingCount : completedCount;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Opiniones</h1>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 mb-4">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setTab(tab)}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab === "PENDING" ? "Pendientes" : "Realizadas"}
          </button>
        ))}
      </div>

      {/* Sub-header row */}
      <div className="flex items-center justify-between mb-4 min-h-6">
        <p className="text-sm text-gray-600">
          {activeTab === "PENDING"
            ? "Opina y ayuda a más personas"
            : "Gracias por contribuir con la comunidad"}
        </p>
        <PaginationText
          from={from}
          to={to}
          total={totalCount}
          tab={activeTab}
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activeTab === "PENDING" ? (
        pendingItems.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <Package className="h-16 w-16 text-gray-200 mx-auto" />
            <p className="text-gray-600">
              No tienes productos pendientes de reseña.
            </p>
            <Link
              href="/productos"
              className="inline-flex text-primary font-medium hover:underline"
            >
              Explorar productos
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {pendingItems.map((item) => (
              <li
                key={item.product_id}
                className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4"
              >
                <Avatar className="h-14 w-14 rounded-lg shrink-0">
                  <AvatarImage
                    className="object-cover"
                    src={item.product_image_url || undefined}
                    alt={item.product_name}
                  />
                  <AvatarFallback className="rounded-lg">
                    <Package className="h-5 w-5 text-gray-400" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 line-clamp-2">
                    {item.product_name}
                  </p>
                </div>
                <StarRating
                  value={0}
                  size="md"
                  onChange={(rating) => handleQuickCreate(item, rating)}
                  className="shrink-0"
                />
                <p className="text-xs text-gray-500 shrink-0 hidden sm:block">
                  Comprado el {formatDate(item.purchased_at)}
                </p>
              </li>
            ))}
          </ul>
        )
      ) : completedItems.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <Star className="h-16 w-16 text-gray-200 mx-auto" />
          <p className="text-gray-600">Aún no has realizado ninguna reseña.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {completedItems.map((item) => (
            <li
              key={item.id}
              className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4"
            >
              <Avatar className="h-14 w-14 rounded-lg shrink-0">
                <AvatarImage
                  className="object-cover"
                  src={item.product_image_url || undefined}
                  alt={item.product_name}
                />
                <AvatarFallback className="rounded-lg">
                  <Package className="h-5 w-5 text-gray-400" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 line-clamp-2">
                  {item.product_name}
                </p>
              </div>
              <StarRating value={item.rating} size="md" readOnly className="shrink-0" />
              <p className="text-xs text-gray-500 shrink-0 hidden sm:block">
                {item.updated_at !== item.created_at
                  ? `Actualizada el ${formatDate(item.updated_at)}`
                  : `Realizada el ${formatDate(item.created_at)}`}
              </p>
              <Link
                href={`/mis-opiniones/${item.id}`}
                className="shrink-0 inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Editar opinión
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-600">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
