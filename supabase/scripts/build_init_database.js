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
  'tables/product_option_types.sql',
  'tables/product_option_values.sql',
  'tables/product_variants.sql',
  'tables/variant_option_values.sql',
  'tables/cart.sql',
  'tables/cart_items.sql',
  'tables/payment_methods.sql',
  'tables/store_settings.sql',

  'tables/orders.sql',

  'tables/order_items.sql',
  'functions/triggers/order_items/copy_product_info_to_order_item.sql',

  'tables/reviews.sql',
  'tables/product_stats.sql',
];

const header = `-- =============================================================================
-- INIT DATABASE — E-commerce
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
--  5. product_option_types / values / variants / variant_option_values
--  6. cart              → profiles
--  7. cart_items        → cart, products, product_variants
--  8. payment_methods
--  9. store_settings     (singleton — config global)
-- 10. orders            → profiles, payment_methods
-- 11. order_items       → orders, products, product_variants + trigger
-- 12. reviews           → products, profiles, orders
-- 13. product_stats     → products
-- ─────────────────────────────────────────────────────────────────────────────
--
-- En DB quedan: is_admin() · trigger copy_product_info_to_order_item
-- Lógica en servidor (checklist): scripts/server_logic_checklist.md
--
-- BD existente (no instalación nueva): scripts/migrate_schema_updates.sql
--
-- Después (opcional):
--   scripts/seed_admin.sql
--   scripts/seed_payment_methods.sql
--   scripts/seed_store_settings.sql
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
