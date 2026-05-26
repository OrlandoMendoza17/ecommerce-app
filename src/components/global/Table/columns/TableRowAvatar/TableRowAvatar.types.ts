interface TableRowAvatarTeam {
  name?: string;
  logo_url?: string;
}

export interface TableRowAvatarProps {
  profile?: Partial<Profile> | null;
  team?: Partial<TableRowAvatarTeam> | null;
}