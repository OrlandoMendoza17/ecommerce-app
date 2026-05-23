import { TableRowProfileNameProps as Props } from "./TableRowProfileName.types"
import Link from "next/link";
import { getFullName, getName } from "@/lib/transformers/profile";

const TableRowProfileName = ({ member_id, profile, variant = 'full' }: Props) => {
  const displayName = variant === 'short' ? getName(profile) : getFullName(profile)
  return (
    <span className="font-medium">
      {
        member_id ?
          <Link href={`/admin/members/${member_id}`} className="hover:underline">
            {displayName}
          </Link>
          :
          <span className="font-medium">
            {displayName}
          </span>
      }
    </span>
  )
}

export default TableRowProfileName