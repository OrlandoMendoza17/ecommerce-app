# Funciones SQL

## En base de datos (mantener)

| Archivo | Tipo |
|---------|------|
| `standalone/profiles/is_admin.sql` | RLS / helper |
| `triggers/order_items/copy_product_info_to_order_item.sql` | Snapshot al checkout |

## En servidor

Ver [`docs/server_logic_checklist.md`](../docs/server_logic_checklist.md).

## Estructura

```
functions/
├── standalone/     # RETURNS ≠ TRIGGER
└── triggers/       # RETURNS TRIGGER + CREATE TRIGGER
```

Tras cambios: `npm run build:db`
