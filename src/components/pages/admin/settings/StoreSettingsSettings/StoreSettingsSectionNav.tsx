const SECTION_NAV = [
  { id: "marca", label: "Marca" },
  { id: "seo", label: "SEO" },
  { id: "contacto", label: "Contacto" },
  { id: "redes", label: "Redes" },
  { id: "pagos", label: "Pagos" },
] as const;

export default function StoreSettingsSectionNav() {
  return (
    <nav className="flex flex-wrap gap-2">
      {SECTION_NAV.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className="text-muted-foreground hover:text-foreground rounded-md border bg-background px-3 py-1 text-sm transition-colors"
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
