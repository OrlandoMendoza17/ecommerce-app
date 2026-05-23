-- =============================================================================
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



-- ── 1. Crear / actualizar los 3 buckets en una sola sentencia ────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'categories_images',
    'categories_images',
    TRUE,
    1048576,
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  ),
  (
    'products_images',
    'products_images',
    TRUE,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  ),
  (
    'profiles_avatars',
    'profiles_avatars',
    TRUE,
    1048576,
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;



-- ── 2. Políticas RLS — categories_images ────────────────────────

DROP POLICY IF EXISTS "Public can view category images" ON storage.objects;
CREATE POLICY "Public can view category images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'categories_images');

-- Solo admins gestionan archivos
DROP POLICY IF EXISTS "Admins can upload category images" ON storage.objects;
CREATE POLICY "Admins can upload category images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'categories_images'
    AND public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can update category images" ON storage.objects;
CREATE POLICY "Admins can update category images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'categories_images'
    AND public.is_admin()
  )
  WITH CHECK (
    bucket_id = 'categories_images'
    AND public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can delete category images" ON storage.objects;
CREATE POLICY "Admins can delete category images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'categories_images'
    AND public.is_admin()
  );

-- ── 3. Políticas RLS — products_images ──────────────────────────

DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
CREATE POLICY "Public can view product images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'products_images');

DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
CREATE POLICY "Admins can upload product images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'products_images'
    AND public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
CREATE POLICY "Admins can update product images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'products_images'
    AND public.is_admin()
  )
  WITH CHECK (
    bucket_id = 'products_images'
    AND public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
CREATE POLICY "Admins can delete product images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'products_images'
    AND public.is_admin()
  );

-- ── 4. Políticas RLS — profiles_avatars ─────────────────────────

DROP POLICY IF EXISTS "Public can view profile avatars" ON storage.objects;
CREATE POLICY "Public can view profile avatars"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'profiles_avatars');

DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profiles_avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profiles_avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'profiles_avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profiles_avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Admins can manage profile avatars" ON storage.objects;
CREATE POLICY "Admins can manage profile avatars"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'profiles_avatars'
    AND public.is_admin()
  )
  WITH CHECK (
    bucket_id = 'profiles_avatars'
    AND public.is_admin()
  );

