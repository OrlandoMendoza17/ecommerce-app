-- ============================================
-- BUCKET: profiles_avatars
-- Tabla: public.profiles.avatar_url
-- Uso: foto de perfil del usuario
-- Ruta: profiles_avatars/{profile_id}/0.{ext}
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profiles_avatars',
  'profiles_avatars',
  TRUE,
  1048576, -- 1 MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

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
