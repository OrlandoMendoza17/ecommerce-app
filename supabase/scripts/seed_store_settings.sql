-- ============================================
-- SCRIPT: Seed de configuración de la tienda
-- Descripción: Inserta la fila singleton si no existe
-- ============================================

INSERT INTO public.store_settings (
  site_name,
  site_tagline,
  meta_title,
  meta_description,
  canonical_base_url,
  default_locale,
  robots_index,
  support_phone,
  whatsapp_number,
  footer_text,
  social_instagram,
  social_facebook,
  social_tiktok
)
SELECT
  'Mi Tienda',
  'Envíos a todo el país · Pagos flexibles',
  'Mi Tienda | E-commerce',
  'Compra online productos de distintas categorías con envío y pagos flexibles.',
  '',
  'es-VE',
  TRUE,
  '+58 412-1234567',
  '584121234567',
  '© 2026 Mi Tienda. Todos los derechos reservados.',
  'https://instagram.com/mitienda',
  'https://facebook.com/mitienda',
  'https://tiktok.com/@mitienda'
WHERE NOT EXISTS (
  SELECT 1 FROM public.store_settings
);
