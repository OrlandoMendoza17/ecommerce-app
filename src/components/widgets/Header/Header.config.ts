export type StoreNavLink = {
  label: string;
  href: string;
};

export const storeNavLinks: StoreNavLink[] = [];

export function isNavLinkActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
