"use client";

import FeatureHeader from "@/components/widgets/FeatureHeader/FeatureHeader";
import ProfilesTable from "@/components/Tables/ProfileTable/ProfileTable";

export default function PlatformProfilesPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-muted min-h-screen">
      <div className="grid grid-cols-[minmax(0,1300px)] justify-center">
        <FeatureHeader
          title="Perfiles"
          description="Consulta y gestiona los perfiles de usuarios de la plataforma"
        />
        <ProfilesTable />
      </div>
    </div>
  );
}
