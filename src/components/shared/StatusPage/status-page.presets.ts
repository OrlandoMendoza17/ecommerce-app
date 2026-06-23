import type { StatusPageAction } from "./StatusPage.types";

export type StatusPagePreset = {
  code: "404" | "error" | "500";
  title: string;
  description: string;
  actions: StatusPageAction[];
};

export type ErrorPagePreset = Omit<StatusPagePreset, "code">;

export const storeNotFoundPreset: StatusPagePreset = {
  code: "404",
  title: "Página no encontrada",
  description:
    "La página que buscas no existe o fue movida. Puedes volver al inicio o explorar el catálogo.",
  actions: [
    { label: "Ir al inicio", href: "/", variant: "default" },
    { label: "Ver productos", href: "/productos", variant: "outline" },
  ],
};

export const adminNotFoundPreset: StatusPagePreset = {
  code: "404",
  title: "Sección no encontrada",
  description:
    "Esta sección del panel no existe. Revisa el menú lateral o vuelve al inicio del admin.",
  actions: [
    { label: "Panel admin", href: "/admin", variant: "default" },
    { label: "Ver pedidos", href: "/admin/orders", variant: "outline" },
  ],
};

export const rootNotFoundPreset: StatusPagePreset = {
  code: "404",
  title: "Página no encontrada",
  description: "No encontramos la página solicitada.",
  actions: [{ label: "Ir al inicio", href: "/", variant: "default" }],
};

export const storeErrorPreset: ErrorPagePreset = {
  title: "Algo salió mal",
  description:
    "Ocurrió un error inesperado al cargar esta página. Puedes reintentar o volver al inicio.",
  actions: [
    { label: "Reintentar", variant: "default" },
    { label: "Ir al inicio", href: "/", variant: "outline" },
  ],
};

export const adminErrorPreset: ErrorPagePreset = {
  title: "Error en el panel",
  description:
    "No pudimos cargar esta sección. Intenta de nuevo o regresa al panel principal.",
  actions: [
    { label: "Reintentar", variant: "default" },
    { label: "Panel admin", href: "/admin", variant: "outline" },
  ],
};

export const rootErrorPreset: ErrorPagePreset = {
  title: "Algo salió mal",
  description: "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
  actions: [
    { label: "Reintentar", variant: "default" },
    { label: "Ir al inicio", href: "/", variant: "outline" },
  ],
};
