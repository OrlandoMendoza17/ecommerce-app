-- ============================================
-- TABLA: public.store_settings
-- Descripción: Configuración global de la tienda (una sola fila)
-- ============================================

CREATE TABLE IF NOT EXISTS public.store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Garantiza una única fila de configuración
  singleton BOOLEAN NOT NULL DEFAULT TRUE UNIQUE,

  -- Identidad de marca
  site_name TEXT NOT NULL DEFAULT '',
  site_tagline TEXT NOT NULL DEFAULT '',
  logo_url TEXT NOT NULL DEFAULT '',
  favicon_url TEXT NOT NULL DEFAULT '',
  og_image_url TEXT NOT NULL DEFAULT '',

  -- SEO global
  meta_title TEXT NOT NULL DEFAULT '',
  meta_description TEXT NOT NULL DEFAULT '',
  canonical_base_url TEXT NOT NULL DEFAULT '',
  default_locale TEXT NOT NULL DEFAULT 'es-VE',
  robots_index BOOLEAN NOT NULL DEFAULT TRUE,

  -- Contacto
  support_email TEXT NOT NULL DEFAULT '',
  support_phone TEXT NOT NULL DEFAULT '',
  whatsapp_number TEXT NOT NULL DEFAULT '',
  footer_text TEXT NOT NULL DEFAULT '',

  -- Redes sociales
  social_instagram TEXT NOT NULL DEFAULT '',
  social_facebook TEXT NOT NULL DEFAULT '',
  social_tiktok TEXT NOT NULL DEFAULT '',

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Storefront: lectura pública (logo, SEO, redes, contacto)
CREATE POLICY "Anyone can view store settings"
  ON public.store_settings
  FOR SELECT
  USING (TRUE);

-- Solo admins pueden crear la fila inicial
CREATE POLICY "Admins can insert store settings"
  ON public.store_settings
  FOR INSERT
  WITH CHECK (is_admin());

-- Solo admins pueden actualizar
CREATE POLICY "Admins can update store settings"
  ON public.store_settings
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());
