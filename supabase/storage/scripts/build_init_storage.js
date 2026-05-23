#!/usr/bin/env node

/**
 * Genera scripts/init_storage.sql (INSERT único + políticas RLS)
 * desde storage/buckets/*.sql
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_ROOT = path.join(__dirname, '../..');
const STORAGE_ROOT = path.join(SUPABASE_ROOT, 'storage');
const OUTPUT = path.join(SUPABASE_ROOT, 'scripts', 'init_storage.sql');

const BUCKETS = [
  {
    id: 'categories_images',
    public: true,
    file_size_limit: 1048576,
    table: 'public.categories.image_url',
  },
  {
    id: 'products_images',
    public: true,
    file_size_limit: 5242880,
    table: 'public.products.images',
  },
  {
    id: 'profiles_avatars',
    public: true,
    file_size_limit: 1048576,
    table: 'public.profiles.avatar_url',
  },
];

const MIME_TYPES = "ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']";

const POLICY_FILES = [
  'buckets/categories_images.sql',
  'buckets/products_images.sql',
  'buckets/profiles_avatars.sql',
];

const header = `-- =============================================================================
-- INIT STORAGE — Crear todos los buckets de un solo golpe
-- =============================================================================
-- GENERADO por: npm run build:storage
-- NO editar manualmente. Modifica storage/buckets/ y vuelve a generar.
--
-- Ejecutar en Supabase → SQL Editor → Run (todo el archivo).
--
-- PREREQUISITO: scripts/init_database.sql (define public.is_admin()).
--
-- Buckets
--   categories_images  →  public.categories.image_url
--   products_images    →  public.products.images
--   profiles_avatars   →  public.profiles.avatar_url
-- =============================================================================

`;

const bucketInsert = `-- ── 1. Crear / actualizar los 3 buckets en una sola sentencia ────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
${BUCKETS.map(
  (b, i) =>
    `  (
    '${b.id}',
    '${b.id}',
    ${b.public ? 'TRUE' : 'FALSE'},
    ${b.file_size_limit},
    ${MIME_TYPES}
  )${i < BUCKETS.length - 1 ? ',' : ''}`
).join('\n')}
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

`;

function extractPolicies(sql) {
  const lines = sql.split('\n');
  const start = lines.findIndex((l) => l.startsWith('DROP POLICY'));
  if (start === -1) return '';
  return lines.slice(start).join('\n').trimEnd();
}

const policyParts = POLICY_FILES.map((rel, index) => {
  const abs = path.join(STORAGE_ROOT, rel);
  if (!fs.existsSync(abs)) {
    console.error(`Missing file: ${rel}`);
    process.exit(1);
  }
  const content = fs.readFileSync(abs, 'utf8');
  const policies = extractPolicies(content);
  const section = rel.replace('buckets/', '').replace('.sql', '');
  return `-- ── ${index + 2}. Políticas RLS — ${section} ─${'─'.repeat(Math.max(0, 40 - section.length))}\n\n${policies}`;
});

fs.writeFileSync(OUTPUT, [header, bucketInsert, ...policyParts, ''].join('\n\n'), 'utf8');
console.log(`Wrote ${OUTPUT}`);
