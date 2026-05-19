# 🏪 E-commerce Database - Supabase

Base de datos para e-commerce de impresiones en madera.

## 📁 Estructura

```
supabase/
├── tables/                    # DDL: tablas, índices, RLS (sin funciones)
│   └── rls/                   # Políticas que dependen de is_admin()
├── functions/
│   ├── standalone/            # Funciones sueltas (RPC, helpers)
│   └── triggers/              # RETURNS TRIGGER + CREATE TRIGGER
├── scripts/
│   ├── build_init_database.js # Genera init_database.sql
│   ├── init_database.sql      # ⚠️ Generado — npm run build:db
│   ├── seed_admin.sql
│   └── seed_payment_methods.sql
└── docs/
```

Ver [`functions/README.md`](functions/README.md). Lógica pendiente en app: [`docs/server_logic_checklist.md`](docs/server_logic_checklist.md).

## 🚀 Inicio rápido

1. Tras cambiar `tables/` o `functions/`, regenera el script completo:

   ```bash
   npm run build:db
   ```

2. En **Supabase → SQL Editor**, ejecuta `scripts/init_database.sql`.

3. Opcional: `seed_admin.sql`, `seed_payment_methods.sql`.

## 👥 Admin

- Función `is_admin()`: `functions/standalone/profiles/is_admin.sql`
- Promover usuario: `scripts/seed_admin.sql`

## 📚 Documentación

- [`docs/setup_database_guide.md`](docs/setup_database_guide.md)
- [`docs/README.md`](docs/README.md)
