import { TableRowSportProps as Props } from "./TableRowSport.types"
import { Trophy, Users } from "lucide-react";

const TableRowSport = ({ sport }: Props) => {
  if (!sport) {
    return (
      <span className="text-sm text-muted-foreground">
        Sin deporte
      </span>
    )
  }
  return (
    <div className="flex items-center gap-1">
      <Trophy className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm">{sport.name}</span>
    </div>
  )
}

export default TableRowSport