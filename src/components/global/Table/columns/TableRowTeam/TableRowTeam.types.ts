export interface TableRowTeamName {
  team?: Partial<Team> | null;
  /** Si true, el link apunta al equipo en admin; si false, al equipo público (explore). */
  is_admin?: boolean;
}