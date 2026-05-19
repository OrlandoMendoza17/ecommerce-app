#!/usr/bin/env node

/**
 * Concatena tables/, functions/ y rls/ en scripts/init_database.sql
 * Orden de dependencias: tablas → is_admin → RLS admin → triggers por entidad
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_ROOT = path.join(__dirname, '..');
const OUTPUT = path.join(__dirname, 'init_database.sql');

const MANIFEST = [
  'tables/profiles.sql',
  'functions/standalone/profiles/is_admin.sql',
  'tables/rls/profiles.sql',

  'tables/addresses.sql',
  'tables/categories.sql',
  'tables/products.sql',
  'tables/cart.sql',
  'tables/cart_items.sql',
  'tables/payment_methods.sql',

  'tables/orders.sql',

  'tables/order_items.sql',
  'functions/triggers/order_items/copy_product_info_to_order_item.sql',

  'tables/reviews.sql',
  'tables/product_stats.sql',
];

const header = `-- =============================================================================
-- INIT DATABASE — E-commerce (impresiones en madera)
-- =============================================================================
-- GENERADO por: npm run build:db
-- NO editar manualmente. Modifica archivos en tables/, functions/ y vuelve a generar.
--
-- Ejecutar UNA VEZ en Supabase → SQL Editor → Run (todo el archivo, en orden).
--
-- ORDEN DE ENTIDADES (dependencias FK y funciones)
-- ─────────────────────────────────────────────────────────────────────────────
--  1. profiles          + is_admin() + políticas RLS admin
--  2. addresses         → profiles
--  3. categories
--  4. products          → categories
--  5. cart              → profiles
--  6. cart_items        → cart, products
--  7. payment_methods
--  8. orders            → profiles, payment_methods
--  9. order_items       → orders, products + trigger copy_product_info_to_order_item
-- 10. reviews           → products, profiles, orders
-- 11. product_stats     → products
-- ─────────────────────────────────────────────────────────────────────────────
--
-- En DB quedan: is_admin() · trigger copy_product_info_to_order_item
-- Lógica en servidor (checklist): scripts/server_logic_checklist.md
--
-- Después (opcional):
--   scripts/seed_admin.sql
--   scripts/seed_payment_methods.sql
-- =============================================================================

`;

const parts = [header];

for (const rel of MANIFEST) {
  const abs = path.join(SUPABASE_ROOT, rel);
  if (!fs.existsSync(abs)) {
    console.error(`Missing file: ${rel}`);
    process.exit(1);
  }
  const content = fs.readFileSync(abs, 'utf8').trimEnd();
  parts.push(
    `-- >>> ${rel}\n`,
    content,
    `\n\n-- <<< ${rel}\n\n`
  );
}

fs.writeFileSync(OUTPUT, parts.join('\n'), 'utf8');
console.log(`Wrote ${OUTPUT} (${MANIFEST.length} files)`);
