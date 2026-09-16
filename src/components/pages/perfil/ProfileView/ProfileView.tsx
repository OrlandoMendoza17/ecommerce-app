"use client";

import Link from "next/link";
import { UserCircle } from "lucide-react";
import { trpc } from "@/config/trpc.config";
import { useAuth } from "@/hooks/useAuth";
import ProfileInfoCard from "../ProfileInfoCard/ProfileInfoCard";
import ProfileAddressesCard from "../ProfileAddressesCard/ProfileAddressesCard";

function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-48 rounded-xl bg-muted" />
      <div className="h-64 rounded-xl bg-muted" />
    </div>
  );
}

export default function ProfileView() {
  const { user, rendered } = useAuth();

  const { data: profile, isLoading } = trpc.profiles.getById.useQuery(
    { id: user?.id ?? "" },
    { enabled: !!user }
  );

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
        <UserCircle className="h-16 w-16 text-muted-foreground mx-auto" />
        <h1 className="text-xl font-bold text-foreground">Mi perfil</h1>
        <p className="text-muted-foreground">
          Inicia sesión para ver y editar tu perfil.
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

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold text-foreground mb-2">Mi perfil</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Administra tu información personal y tus direcciones de entrega.
      </p>

      {isLoading || !profile ? (
        <ProfileSkeleton />
      ) : (
        <div className="space-y-6">
          <ProfileInfoCard profile={profile} />
          <ProfileAddressesCard />
        </div>
      )}
    </div>
  );
}
