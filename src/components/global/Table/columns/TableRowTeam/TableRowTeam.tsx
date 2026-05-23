import { TableRowTeamName as Props } from "./TableRowTeam.types";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { IoIosFootball } from "react-icons/io";

const TableRowTeam = ({ team, is_admin = false }: Props) => {
  const teamWithClub = team as { id?: string; club_id?: string } | null | undefined;
  const href = !teamWithClub?.id
    ? "#"
    : is_admin
      ? `/admin/teams/${teamWithClub.id}/team-members`
      : teamWithClub.club_id
        ? `/explore/clubs/${teamWithClub.club_id}/teams/${teamWithClub.id}`
        : "#";

  return (
    <span className="flex items-center gap-2">
      <Avatar className="h-10 w-10 rounded-none">
        <AvatarImage
          className="object-cover aspect-auto"
          src={team?.logo_url}
          alt={team?.name || ""}
        />
        <AvatarFallback>
          <IoIosFootball className="h-5 w-5" />
        </AvatarFallback>
      </Avatar>
      <Link href={href} className="flex items-center gap-1 hover:underline">
        {team?.name || "Sin equipo"}
      </Link>
    </span>
  );
};

export default TableRowTeam