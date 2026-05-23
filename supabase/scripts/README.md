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

## Migraciones

Solo si ya tienes una base desplegada con un esquema anterior. En fase de diseño inicial, usa `init_database.sql` tras `build:db`.
