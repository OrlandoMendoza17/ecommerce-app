-- ============================================
-- BUCKET: categories_images
-- Tabla: public.categories.image_url
-- Uso: imagen representativa de cada categoría (FormFileInput)
-- Ruta: categories_images/{category_id}/0.{ext}
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'categories_images',
  'categories_images',
  TRUE,
  1048576, -- 1 MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Lectura pública (catálogo / URLs firmadas de larga duración)
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
