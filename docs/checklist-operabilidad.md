# Checklist de operabilidad

Prioridad de mayor a menor.  
`[x]` = implementado en código · `[ ]` = no implementado.

Algunos ítems de configuración (API keys, crons, seeds) están en código pero **hay que activarlos en producción**. Eso se marca aparte.

---

## 1. Ya listo — base para operar (MVP)

- [x] Catálogo: productos, variantes, stock, categorías
- [x] CRUD admin de marcas
- [x] Carrito (usuario autenticado y guest)
- [x] Checkout autenticado
- [x] Checkout de invitado (`createGuestOrder`)
- [x] Direcciones del cliente (perfil)
- [x] Pago manual con comprobante (Pago Móvil, transferencia, Zelle, etc.)
- [x] Confirmación de pago por admin (descuenta stock)
- [x] Pedidos: estados, enviar, entregar, cancelar, rastreo
- [x] Reserva de stock al crear pedido
- [x] Historial `/mis-compras`
- [x] Auth: login, registro, reset, magic link
- [x] Perfil de cliente
- [x] Opiniones del cliente (`/mis-opiniones`)
- [x] Reseñas públicas en ficha de producto
- [x] Moderación de reseñas en admin (`/admin/reviews`)
- [x] Admin: pedidos, productos, categorías, marcas, clientes (listado), settings
- [x] Settings de tienda / SEO / branding
- [x] Emails transaccionales (Resend): pedido creado, pago recibido (admin), pago confirmado, enviado, cancelado
- [x] Formulario de contacto real (`trpc.contact.send`)
- [x] Páginas legales, FAQ, envíos
- [x] Filtro de marcas en catálogo (`/productos?marca=`)

---

## 2. Crítico — para operar de verdad

Configuración y huecos que hoy rompen o degradan una venta real.

### 2.1 Configuración de producción

Código listo; falta activarlo en el entorno.

- [ ] Métodos de pago activos cargados en prod
- [ ] Productos con variantes y stock en prod
- [ ] `RESEND_API_KEY` + `EMAIL_FROM` configurados
- [ ] `support_email` en `store_settings`
- [ ] Cron `/api/cron/expire-orders` desplegado (`CRON_API_KEY`)
- [ ] Cron `/api/cron/ves-rates` desplegado (si se cobra en Bs)
- [ ] Migración de marcas + bucket `brands_images` aplicada en prod (si aún no)

### 2.2 Tasa de cambio VES

- [x] Tabla `exchange_rates` + lectura en tienda
- [x] Cron para insertar tasa (`/api/cron/ves-rates`)
- [ ] UI admin para cargar / editar / ver historial de tasas
- [ ] Al menos una fila de tasa en prod (sin esto el pago en Bs falla)

### 2.3 Emails a invitados

Confirmación, envío, cancelación y reembolso usan `profile.email` o, si no hay perfil, `guest_email`.

- [x] Email de pedido creado (incluye guest)
- [x] Email de pago recibido al admin
- [x] Pago confirmado / enviado / cancelado usando `guest_email` cuando no hay profile

### 2.4 Envío de invitados

- [x] Guest puede confirmar pedido
- [x] Modo “coordinar entrega”
- [x] Capturar dirección de envío en checkout guest

### 2.5 Envío e impuestos en el total

- [ ] `shipping_cost` calculado (hoy siempre 0; “a coordinar”)
- [ ] `tax` calculado (hoy siempre 0; total = subtotal)
- [ ] Zonas / tarifas de envío

---

## 3. Importante — vender más fluido

No bloquean abrir, pero duelen en el día a día.

- [x] Ficha de cliente en admin (consulta: pedidos, direcciones, reseñas; sin editar)
- [ ] Pasarela de pago automática (Stripe, Mercado Pago, etc.) — hoy solo comprobante
- [ ] Alertas de stock bajo en admin (el umbral existe en variantes; no hay inbox/alerta)
- [x] Flujo de reembolso (existe status `refunded`, acción admin de pedido completo)
- [ ] FAQ alineada con checkout guest (aún puede decir que se requiere cuenta)

---

## 4. Útil — no bloquea el día 1

- [ ] Cupones / descuentos con código (columna `discount` existe, siempre 0)
- [ ] Página de marcas en tienda (`/marcas`, como `/categorias`)
- [ ] Sitemap + `robots.txt`
- [ ] JSON-LD / datos estructurados
- [ ] Analytics más allá del dashboard admin básico
- [ ] Wishlist
- [ ] Facturas / PDF
- [ ] Portal de devoluciones

---

## Notas

Ítems de listas viejas que **ya no aplican** (están hechos):

- Emails transaccionales “no existen” → sí existen; falta cubrir guests en algunos eventos.
- `/contacto` es stub → ya envía por tRPC + email.
- Checkout de invitado “exige login” → ya no; el carrito crea pedido guest.
- Moderación de reseñas “sin UI” → ya está en `/admin/reviews`.
