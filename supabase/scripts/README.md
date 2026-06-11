# 🔧 Scripts

## `init_database.sql` ⭐

Script completo para instalación nueva. **Se genera automáticamente** — no editar a mano.

```bash
npm run build:db
```

Concatena en orden: `tables/` → `functions/standalone/` → `functions/triggers/` (ver lista en `build_init_database.js`).

## `build_init_database.js`

Orquestador que produce `init_database.sql` desde el manifiesto de archivos.

## Checklist app

[`docs/server_logic_checklist.md`](../docs/server_logic_checklist.md) — features que antes eran triggers y deben vivir en el servidor.

## Seeds

| Archivo                    | Uso                                     |
| -------------------------- | --------------------------------------- |
| `seed_admin.sql`           | `profiles.is_admin = TRUE` para un UUID |
| `seed_payment_methods.sql` | Métodos de pago de ejemplo              |
| `seed_store_settings.sql`  | Fila singleton de configuración de tienda |

## Migraciones

Solo si ya tienes una base desplegada con un esquema anterior. En fase de diseño inicial, usa `init_database.sql` tras `build:db`.

| Archivo | Uso |
|---------|-----|
| `reset_and_rebuild_catalog.sql` | **Reset destructivo**: borra tablas de catálogo/pedidos/carrito (conserva `profiles`/`addresses`) y recrea desde el repo. Storage: solo upsert de buckets (no los elimina). `npm run build:reset-catalog` |
| `verify_and_sync_table_schemas.sql` | **Auditoría + sync**: compara columnas BD vs `tables/*.sql` y reconcilia (reporte + ALTER) |
| `migrate_store_settings.sql` | **Migración**: tabla `store_settings` + ejecutar `storage/buckets/store_assets.sql` |
| `migrate_exchange_rates.sql` | **Migración**: tabla `exchange_rates` + políticas RLS |
| `migrate_schema_updates.sql` | **Migración consolidada**: variantes, cart/order_items, products legacy, RLS pago, bucket comprobantes |
| `migrate_product_variants.sql` | *(obsoleto — usar migrate_schema_updates.sql)* |
| `migrate_remove_product_options.sql` | *(incluido en migrate_schema_updates.sql)* |
| `migrate_remove_product_material_short_description.sql` | *(incluido en migrate_schema_updates.sql)* |

```bash
npm run build:db   # regenerar init_database.sql tras cambiar tables/
```
