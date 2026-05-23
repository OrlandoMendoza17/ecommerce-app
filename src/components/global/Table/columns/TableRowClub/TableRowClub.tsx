import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Building2 } from "lucide-react";
import { TableRowClubProps as Props } from "./TableRowClub.types";

const TableRowClub = ({ club }: Props) => {
  if (!club) return <span className="text-sm text-muted-foreground">-</span>;

  const { name, logo_url } = club;
  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-10 w-10 rounded-none">
        <AvatarImage
          className="object-cover aspect-auto"
          src={logo_url}
          alt={name}
        />
        <AvatarFallback>
          <Building2 className="h-5 w-5" />
        </AvatarFallback>
      </Avatar>
      <span className="text-sm font-medium truncate">{name}</span>
    </div>
  );
};

export default TableRowClub;
