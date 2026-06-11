-- ============================================
-- BUCKET: store_assets
-- Tabla: public.store_settings (logo_url, favicon_url, og_image_url)
-- Uso: logo, favicon e imagen OG de la tienda
-- Ruta: store_assets/{asset_type}/0.{ext}
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'store_assets',
  'store_assets',
  TRUE,
  2097152, -- 2 MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/x-icon',
    'image/vnd.microsoft.icon'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public can view store assets" ON storage.objects;
CREATE POLICY "Public can view store assets"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'store_assets');

DROP POLICY IF EXISTS "Admins can upload store assets" ON storage.objects;
CREATE POLICY "Admins can upload store assets"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'store_assets'
    AND public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can update store assets" ON storage.objects;
CREATE POLICY "Admins can update store assets"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'store_assets'
    AND public.is_admin()
  )
  WITH CHECK (
    bucket_id = 'store_assets'
    AND public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can delete store assets" ON storage.objects;
CREATE POLICY "Admins can delete store assets"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'store_assets'
    AND public.is_admin()
  );
