"use client";

import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import DeleteEntityModal from "@/components/widgets/DeleteEntityModal/DeleteEntityModal";
import AddressModal from "../AddressModal/AddressModal";
import { trpc } from "@/config/trpc.config";

function AddressCard({ address }: { address: Address }) {
  const utils = trpc.useUtils();

  const addressLabel =
    [address.full_name, address.city].filter(Boolean).join(" — ") || "Dirección";

  const lines = [
    address.address_line1,
    address.address_line2,
    [address.city, address.state].filter(Boolean).join(", "),
    [address.postal_code, address.country].filter(Boolean).join(", "),
  ].filter(Boolean);

  return (
    <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4">
      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-gray-900">{address.full_name}</p>
          {address.is_default && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              <Star className="h-2.5 w-2.5 fill-current" />
              Predeterminada
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-gray-500">{address.phone}</p>
        <p className="mt-1 text-sm text-gray-700 leading-relaxed">
          {lines.join(" · ")}
        </p>
      </div>

      <div className="flex shrink-0 gap-1">
        <AddressModal address={address}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-500 hover:text-gray-900"
            aria-label="Editar dirección"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </AddressModal>

        <DeleteEntityModal
          entity="dirección"
          name={addressLabel}
          id={address.id}
          mutation={trpc.addresses.delete}
          onDeleteSuccess={() => {
            void utils.addresses.listMine.invalidate();
          }}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-500 hover:text-red-600"
            aria-label="Eliminar dirección"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </DeleteEntityModal>
      </div>
    </div>
  );
}

function EmptyAddresses() {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <MapPin className="h-10 w-10 text-gray-200" />
      <div>
        <p className="font-medium text-gray-900">Sin direcciones guardadas</p>
        <p className="mt-1 text-sm text-gray-500">
          Agrega una dirección para agilizar tus pedidos.
        </p>
      </div>
    </div>
  );
}

export default function ProfileAddressesCard() {
  const { data: addresses = [], isLoading } = trpc.addresses.listMine.useQuery();

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <MapPin className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle>Direcciones de entrega</CardTitle>
            <CardDescription className="mt-0.5">
              Guarda tus direcciones para un checkout más rápido
            </CardDescription>
          </div>
        </div>

        <AddressModal>
          <Button type="button" size="sm" className="shrink-0">
            <Plus className="h-4 w-4" />
            Agregar
          </Button>
        </AddressModal>
      </CardHeader>

      <CardContent className="space-y-3">
        {isLoading ? (
          <p className="py-6 text-center text-sm text-gray-400">
            Cargando direcciones...
          </p>
        ) : addresses.length === 0 ? (
          <EmptyAddresses />
        ) : (
          <div className="space-y-3">
            {addresses.map((address) => (
              <AddressCard key={address.id} address={address} />
            ))}
          </div>
        )}

        {!isLoading && addresses.length > 0 && (
          <>
            <Separator />
            <p className="text-xs text-gray-400">
              La dirección predeterminada se seleccionará automáticamente al realizar un pedido.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
