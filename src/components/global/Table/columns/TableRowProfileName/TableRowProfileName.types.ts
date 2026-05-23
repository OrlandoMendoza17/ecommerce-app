export interface TableRowProfileNameProps {
  member_id?: string
  profile?: Partial<Profile> | null
  /** 'full' = nombre + apellidos (getFullName), 'short' = nombre + apellido (getName). Default: 'full' */
  variant?: 'full' | 'short'
}