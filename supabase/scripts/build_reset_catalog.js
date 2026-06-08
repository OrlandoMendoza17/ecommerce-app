#!/usr/bin/env node

/**
 * Genera scripts/reset_and_rebuild_catalog.sql
 * - Elimina tablas del catálogo/pedidos/carrito (conserva profiles + addresses)
 * - Recrea todo desde supabase/tables/ (y opcionalmente sincroniza buckets vía FASE 3)
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_ROOT = path.join(__dirname, '..');
const OUTPUT = path.join(__dirname, 'reset_and_rebuild_catalog.sql');

const CREATE_MANIFEST = [
  'tables/categories.sql',
  'tables/products.sql',
  'tables/product_option_types.sql',
  'tables/product_option_values.sql',
  'tables/product_variants.sql',
  'tables/variant_option_values.sql',
  'tables/cart.sql',
  'tables/cart_items.sql',
  'tables/payment_methods.sql',
  'tables/orders.sql',
  'tables/order_items.sql',
  'functions/triggers/order_items/copy_product_info_to_order_item.sql',
  'tables/reviews.sql',
  'tables/product_stats.sql',
  'functions/standalone/orders/submit_order_payment.sql',
];

const STORAGE_MANIFEST = [
  'storage/buckets/categories_images.sql',
  'storage/buckets/products_images.sql',
  'storage/buckets/order_payment_proofs.sql',
];

const TABLES_DROP_ORDER = [
  'product_stats',
  'reviews',
  'order_items',
  'orders',
  'cart_items',
  'cart',
  'variant_option_values',
  'product_variants',
  'product_option_values',
  'product_option_types',
  'payment_methods',
  'products',
  'categories',
];

const header = `-- =============================================================================
-- RESET CATÁLOGO + PEDIDOS + CARRITO (conserva profiles y addresses)
-- =============================================================================
-- GENERADO por: npm run build:reset-catalog
-- NO editar manualmente. Modifica supabase/tables/ y vuelve a generar.
--
-- ⚠️  DESTRUCTIVO: borra datos de productos, pedidos, carritos, métodos de pago y reseñas.
--
-- CONSERVA:
--   - public.profiles, public.addresses (y sus datos)
--   - public.is_admin()
--   - Todos los buckets de Storage (no se eliminan; FASE 3 solo actualiza config/RLS)
--   - auth.users (Supabase Auth)
--
-- PREREQUISITOS: profiles + is_admin() ya existen (init_database o equivalente).
--
-- DESPUÉS (opcional):
--   scripts/seed_payment_methods.sql
-- =============================================================================

`;

const dropSection = `-- =============================================================================
-- FASE 1 — ELIMINAR (funciones + tablas)
-- =============================================================================

-- Funciones y trigger ligados a tablas que se eliminan
DROP TRIGGER IF EXISTS trigger_1_copy_product_info ON public.order_items;
DROP FUNCTION IF EXISTS public.submit_order_payment(UUID, UUID, UUID, TEXT, DATE, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.copy_product_info_to_order_item();

-- Tablas (orden: hijos primero)
${TABLES_DROP_ORDER.map(
  (t) => `DROP TABLE IF EXISTS public.${t} CASCADE;`
).join('\n')}

`;

function readFile(rel) {
  const abs = path.join(SUPABASE_ROOT, rel);
  if (!fs.existsSync(abs)) {
    console.error(`Missing: ${rel}`);
    process.exit(1);
  }
  return fs.readFileSync(abs, 'utf8').trimEnd();
}

const createParts = CREATE_MANIFEST.map((rel) => {
  const content = readFile(rel);
  return `-- >>> ${rel}\n\n${content}\n\n-- <<< ${rel}\n`;
});

const storageParts = [
  `-- =============================================================================
-- FASE 3 — STORAGE (opcional: upsert buckets + políticas; no elimina buckets)
-- =============================================================================
`,
  ...STORAGE_MANIFEST.map((rel) => {
    const content = readFile(rel);
    return `-- >>> ${rel}\n\n${content}\n\n-- <<< ${rel}\n`;
  }),
];

const footer = `
-- =============================================================================
-- FIN — Verifica en Table Editor: categories, products, orders, cart, etc.
-- =============================================================================
`;

const body = [
  header,
  dropSection,
  `-- =============================================================================
-- FASE 2 — RECREAR TABLAS, RLS, TRIGGERS Y RPC
-- =============================================================================

`,
  ...createParts,
  ...storageParts,
  footer,
].join('\n');

fs.writeFileSync(OUTPUT, body, 'utf8');
console.log(`Wrote ${OUTPUT}`);
console.log(`  DROP: ${TABLES_DROP_ORDER.length} tables`);
console.log(`  CREATE: ${CREATE_MANIFEST.length} files + ${STORAGE_MANIFEST.length} buckets`);
