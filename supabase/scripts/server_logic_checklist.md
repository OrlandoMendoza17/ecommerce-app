# Checklist: lógica en servidor (reemplazo de triggers eliminados)

La base de datos conserva solo:

- `is_admin()` — RLS
- `copy_product_info_to_order_item` — snapshot de precio y datos al insertar `order_items`

Todo lo siguiente debe implementarse en **Server Actions / API routes** (nunca solo en el cliente).

---

## Perfiles (`profiles`)

**Antes:** trigger `prevent_profile_admin_self_promotion`

- [ ] Al actualizar perfil, si el usuario **no** es admin, rechazar o ignorar cambios en `is_admin`
- [ ] Solo admins (o service role) pueden promover `is_admin = true`
- [ ] Endpoint de promoción admin: usar `seed_admin.sql` o panel con service role

**Entidad / endpoint sugerido:** `PATCH /api/profile` · `POST /api/admin/users/:id/promote`

---

## Órdenes (`orders`)

**Antes:** trigger `generate_order_number`

- [ ] Al crear orden en checkout, asignar `order_number` (formato `YY######` o el que definas)
- [ ] Evitar colisiones: transacción, advisory lock o secuencia en DB si hay alto volumen
- [ ] No depender de string vacío en insert; enviar siempre el número desde servidor

**Entidad / endpoint sugerido:** `POST /api/checkout` (crea `orders`)

---

**Antes:** trigger `update_order_status_timestamps`

- [ ] Al cambiar `status` desde admin, en el mismo update:
  - [ ] `payment_confirmed` → setear `paid_at = now()`
  - [ ] `shipped` → setear `shipped_at = now()`
  - [ ] `delivered` → setear `delivered_at = now()`
- [ ] Solo actualizar la fecha en la transición a ese estado (no sobrescribir si ya existía)

**Entidad / endpoint sugerido:** `PATCH /api/admin/orders/:id`

---

## Líneas de pedido (`order_items`)

**Antes:** trigger `calculate_order_item_subtotal`

- [ ] Al insertar cada línea, calcular `subtotal = quantity * unit_price`
- [ ] El trigger `copy_product_info_to_order_item` ya fija `unit_price` desde `products`; calcular subtotal **después** en servidor o en el mismo insert si envías ambos campos
- [ ] Validar que `orders.subtotal` / `orders.total` coincidan con la suma de líneas + envío + impuestos − descuento

**Entidad / endpoint sugerido:** `POST /api/checkout` (crea `order_items` tras `orders`)

**Nota:** `copy_product_info_to_order_item` sigue en DB; no envíes `unit_price` manipulado desde el cliente sin validar.

---

## Reseñas (`reviews`)

**Antes:** trigger `verify_purchase_on_review`

- [ ] Antes de insertar reseña, comprobar compra (misma lógica que RLS: `order_items` + `orders` del usuario)
- [ ] Si hay `order_id`, validar que corresponda al producto y perfil
- [ ] Setear `is_verified_purchase = true` cuando aplique
- [ ] Alinear estados de orden válidos con tu CHECK (`delivered`, etc.; no usar `completed` si no existe en `orders.status`)

**Entidad / endpoint sugerido:** `POST /api/reviews`

---

## Estadísticas de producto (`product_stats`)

**Antes:** `update_product_stats()` + triggers en `order_items` y `reviews`

- [ ] Tras **confirmar pedido** (o cuando el estado deje de ser cancelado/refunded), recalcular stats por cada `product_id` del pedido
- [ ] Tras **aprobar reseña** (admin), recalcular stats de ese `product_id`
- [ ] Tras eliminar/rechazar reseña, recalcular si afecta promedios
- [ ] Implementar query de agregación (ventas desde `order_items` + `orders`, reseñas aprobadas desde `reviews`) o RPC interna
- [ ] (Opcional) Cron nocturno para recalcular todo el catálogo

**Entidad / endpoint sugerido:**

- `POST /api/checkout` → recalcular productos del carrito
- `PATCH /api/admin/reviews/:id` → al cambiar `is_approved`
- `lib/product-stats.ts` → `recalculateProductStats(productId)`

---

## Resumen por prioridad

| Prioridad | Feature | Tabla |
|-----------|---------|--------|
| Alta | Snapshot checkout + subtotales + totales orden | `order_items`, `orders` |
| Alta | Anti auto-promoción admin | `profiles` |
| Media | Número de orden | `orders` |
| Media | Fechas al cambiar estado | `orders` |
| Media | Verificación compra en reseña | `reviews` |
| Baja | Recalcular `product_stats` | `product_stats` |

---

## Referencia SQL (stats — ejemplo para servidor)

```sql
-- Ventas (excluir cancelados/reembolsados)
SELECT COALESCE(SUM(oi.quantity), 0), COALESCE(SUM(oi.subtotal), 0)
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
WHERE oi.product_id = $1 AND o.status NOT IN ('cancelled', 'refunded');

-- Reseñas aprobadas
SELECT COUNT(*), COALESCE(AVG(rating), 0)
FROM reviews WHERE product_id = $1 AND is_approved = true;
```

Luego `INSERT ... ON CONFLICT (product_id) DO UPDATE` en `product_stats`.
