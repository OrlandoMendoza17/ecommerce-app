"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { trpc } from "@/config/trpc.config";
import { useToast } from "@/hooks/useToast";

type DeliveryMode = "pending" | "address" | "coordinate";

interface OrderShippingSectionProps {
  orderId: string;
  initialMode: DeliveryMode;
  guestAccessToken?: string;
  onModeChange?: (mode: Exclude<DeliveryMode, "pending">) => void;
}

function pickDefaultAddressId(addresses: Address[]): string | null {
  if (addresses.length === 0) return null;
  return addresses.find((a) => a.is_default)?.id ?? addresses[0].id;
}

function formatAddressLabel(addr: Address): string {
  const parts = [
    addr.address_line1,
    addr.address_line2,
    [addr.city, addr.state].filter(Boolean).join(", "),
  ].filter(Boolean);
  return parts.join(" · ");
}

export default function OrderShippingSection({
  orderId,
  initialMode,
  guestAccessToken,
  onModeChange,
}: OrderShippingSectionProps) {
  const { errorToast } = useToast();
  const utils = trpc.useUtils();
  const isGuest = !!guestAccessToken;

  const [mode, setMode] = useState<DeliveryMode>(initialMode);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Guests have no saved addresses — skip the query entirely
  const { data: addresses = [], isLoading: addressesLoading } =
    trpc.addresses.listMine.useQuery(undefined, { enabled: !isGuest });

  const setShippingMutation = trpc.orders.setShipping.useMutation({
    onSuccess: () => {
      utils.orders.getById.invalidate({ id: orderId });
    },
    onError: errorToast,
  });

  useEffect(() => {
    if (addresses.length === 0) return;
    setSelectedAddressId((current) => {
      if (current && addresses.some((a) => a.id === current)) return current;
      return pickDefaultAddressId(addresses);
    });
  }, [addresses]);

  const handleModeSelect = async (newMode: "address" | "coordinate") => {
    if (newMode === "address" && !selectedAddressId) return;

    setMode(newMode);
    setSaving(true);
    try {
      if (newMode === "address") {
        await setShippingMutation.mutateAsync({
          id: orderId,
          mode: "address",
          address_id: selectedAddressId!,
          guest_access_token: guestAccessToken,
        });
      } else {
        await setShippingMutation.mutateAsync({
          id: orderId,
          mode: "coordinate",
          guest_access_token: guestAccessToken,
        });
      }
      onModeChange?.(newMode);
    } catch {
      setMode(initialMode);
    } finally {
      setSaving(false);
    }
  };

  const handleAddressSelect = async (addressId: string) => {
    setSelectedAddressId(addressId);
    setSaving(true);
    try {
      await setShippingMutation.mutateAsync({
        id: orderId,
        mode: "address",
        address_id: addressId,
        guest_access_token: guestAccessToken,
      });
      setMode("address");
      onModeChange?.("address");
    } catch {
      // error handled by onError
    } finally {
      setSaving(false);
    }
  };

  // ── Guest view: only coordinate, already pre-set ──────────────────────────
  if (isGuest) {
    return (
      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Modalidad de entrega
        </p>
        <div className="rounded-lg border border-primary bg-primary/5 ring-1 ring-primary p-4">
          <p className="text-sm font-semibold text-gray-900 leading-snug">
            Coordinar con el vendedor
          </p>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
            Acordamos el envío contigo directamente
          </p>
        </div>
      </div>
    );
  }

  // ── Authenticated user view ───────────────────────────────────────────────
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        Modalidad de entrega
      </p>

      {/* Options */}
      <div className="grid sm:grid-cols-2 gap-3">
        {/* Address option */}
        <button
          type="button"
          disabled={saving || addressesLoading || addresses.length === 0}
          onClick={() => handleModeSelect("address")}
          className={`
            rounded-lg border p-4 text-left transition-all
            disabled:opacity-50 disabled:cursor-not-allowed
            ${mode === "address"
              ? "border-primary bg-primary/5 ring-1 ring-primary"
              : "border-gray-200 hover:border-primary/40 bg-white"
            }
          `}
        >
          <p className="text-sm font-semibold text-gray-900 leading-snug">
            Enviar a dirección
          </p>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
            {addresses.length === 0
              ? "Sin direcciones guardadas"
              : "Elige una de tus direcciones"}
          </p>
        </button>

        {/* Coordinate option */}
        <button
          type="button"
          disabled={saving}
          onClick={() => handleModeSelect("coordinate")}
          className={`
            rounded-lg border p-4 text-left transition-all
            disabled:opacity-50 disabled:cursor-not-allowed
            ${mode === "coordinate"
              ? "border-primary bg-primary/5 ring-1 ring-primary"
              : "border-gray-200 hover:border-primary/40 bg-white"
            }
          `}
        >
          <p className="text-sm font-semibold text-gray-900 leading-snug">
            Coordinar con el vendedor
          </p>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
            Acordamos el envío contigo directamente
          </p>
        </button>
      </div>

      {/* Saving indicator */}
      {saving && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Guardando…
        </div>
      )}

      {/* Address list */}
      {mode !== "coordinate" && (
        <div className="space-y-2">
          {addressesLoading ? (
            <div className="flex items-center gap-2 py-2 text-xs text-gray-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Cargando direcciones…
            </div>
          ) : addresses.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 px-4 py-4 text-center space-y-2">
              <p className="text-sm text-gray-500">No tienes direcciones guardadas.</p>
              <Link
                href="/perfil"
                className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar dirección
              </Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {addresses.map((addr) => (
                <li key={addr.id}>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleAddressSelect(addr.id)}
                    className={`
                      w-full flex items-start gap-3 rounded-lg border px-4 py-3 text-left transition-all
                      disabled:opacity-60 disabled:cursor-not-allowed
                      ${selectedAddressId === addr.id && mode === "address"
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-gray-200 hover:border-primary/40 bg-white"
                      }
                    `}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 leading-snug">
                        {addr.full_name || addr.city || "Dirección"}
                        {addr.is_default && (
                          <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-primary">
                            Predeterminada
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                        {formatAddressLabel(addr)}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
              <li>
                <Link
                  href="/perfil"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline pt-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Agregar dirección
                </Link>
              </li>
            </ul>
          )}
        </div>
      )}

      {/* Validation hint when still pending */}
      {mode === "pending" && !saving && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Selecciona cómo deseas recibir tu pedido para continuar.
        </p>
      )}
    </div>
  );
}
