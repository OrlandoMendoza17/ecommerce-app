import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { User } from "lucide-react"
import { IoIosFootball } from "react-icons/io"
import { TableRowAvatarProps as Props } from "./TableRowAvatar.types"

const TableRowAvatar = ({ profile, team }: Props) => {
  const alt = profile?.first_name || team?.name || '';
  const url = profile?.avatar_url || team?.logo_url;

  const is_team = !!team;
  return (
    <div className="flex items-center justify-center">
      <Avatar className={`h-10 w-10 ${is_team ? 'rounded-none' : ''}`}>
        <AvatarImage className="object-cover aspect-auto" src={url} alt={alt} />
        <AvatarFallback>
          {profile ? <User className="h-5 w-5" /> : <IoIosFootball className="h-5 w-5" />}
        </AvatarFallback>
      </Avatar>
    </div>
  )
}

export default TableRowAvatar