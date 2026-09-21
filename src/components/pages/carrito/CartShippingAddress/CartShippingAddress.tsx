"use client";

import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import { cn } from "@/lib/utils";

function formatAddressSummary(address: Address): string {
  return [
    address.address_line1,
    address.address_line2,
    [address.city, address.state].filter(Boolean).join(", "),
    [address.postal_code, address.country].filter(Boolean).join(", "),
  ]
    .filter(Boolean)
    .join(" · ");
}

interface CartShippingAddressProps {
  addresses: Address[];
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function CartShippingAddress({
  addresses,
  isLoading,
  selectedId,
  onSelect,
}: CartShippingAddressProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-muted px-4 py-3">
        <p className="text-sm text-muted-foreground">Cargando direcciones...</p>
      </div>
    );
  }

  if (addresses.length === 0) {
    return (
      <div className="rounded-lg border border-warning/30 bg-warning-foreground/10 px-4 py-3 space-y-2">
        <p className="text-sm font-medium text-warning">
          Necesitas una dirección de envío
        </p>
        <p className="text-xs text-warning">
          Agrega al menos una dirección en tu perfil para confirmar el pedido.
        </p>
        <Link
          href="/perfil"
          className="inline-flex text-xs font-semibold text-primary hover:underline"
        >
          Ir a mi perfil →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        Dirección de envío
      </p>

      <ul className="space-y-2" role="radiogroup" aria-label="Dirección de envío">
        {addresses.map((address) => {
          const isSelected = selectedId === address.id;

          return (
            <li key={address.id}>
              <label
                className={cn(
                  "flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors",
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border hover:border-border hover:bg-muted",
                )}
              >
                <input
                  type="radio"
                  name="shipping-address"
                  value={address.id}
                  checked={isSelected}
                  onChange={() => onSelect(address.id)}
                  className="mt-1 h-4 w-4 shrink-0 accent-primary"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {address.full_name}
                    </span>
                    {address.is_default && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                        <Star className="h-2 w-2 fill-current" />
                        Predeterminada
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {address.phone}
                  </span>
                  <span className="mt-1 block text-xs text-foreground leading-relaxed">
                    {formatAddressSummary(address)}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      <Link
        href="/perfil"
        className="inline-block text-xs text-muted-foreground hover:text-primary hover:underline"
      >
        Gestionar direcciones
      </Link>
    </div>
  );
}
