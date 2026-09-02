-- ============================================
-- BUCKET: order_payment_proofs
-- Uso: comprobantes de pago de pedidos (cliente)
-- Ruta: order_payment_proofs/{user_id}/{order_id}/0.{ext}
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'order_payment_proofs',
  'order_payment_proofs',
  TRUE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public can view order payment proofs" ON storage.objects;
CREATE POLICY "Public can view order payment proofs"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'order_payment_proofs');

DROP POLICY IF EXISTS "Users can upload own order payment proofs" ON storage.objects;
CREATE POLICY "Users can upload own order payment proofs"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'order_payment_proofs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update own order payment proofs" ON storage.objects;
CREATE POLICY "Users can update own order payment proofs"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'order_payment_proofs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'order_payment_proofs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Guests can upload order payment proofs" ON storage.objects;
CREATE POLICY "Guests can upload order payment proofs"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (
    bucket_id = 'order_payment_proofs'
    AND (storage.foldername(name))[1] = 'guest'
  );

DROP POLICY IF EXISTS "Guests can update order payment proofs" ON storage.objects;
CREATE POLICY "Guests can update order payment proofs"
  ON storage.objects
  FOR UPDATE
  TO anon
  USING (
    bucket_id = 'order_payment_proofs'
    AND (storage.foldername(name))[1] = 'guest'
  )
  WITH CHECK (
    bucket_id = 'order_payment_proofs'
    AND (storage.foldername(name))[1] = 'guest'
  );
