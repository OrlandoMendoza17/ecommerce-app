-- =============================================================================
-- MIGRACIÓN: reviews.is_approved DEFAULT FALSE
-- =============================================================================
-- Ejecutar en Supabase → SQL Editor → Run.
--
-- Qué hace:
--   Cambia el default de is_approved a FALSE.
--   Las reseñas nuevas quedan ocultas hasta que un admin las apruebe en /admin/reviews.
--
-- Qué NO hace:
--   No modifica filas existentes. Las reseñas ya aprobadas siguen públicas.
--
-- Idempotente.
-- =============================================================================

ALTER TABLE public.reviews
  ALTER COLUMN is_approved SET DEFAULT FALSE;
