-- ============================================
-- TABLA: public.addresses
-- Descripción: Direcciones de envío de los usuarios
-- ============================================

CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Información de dirección
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  address_line1 TEXT NOT NULL DEFAULT '',
  address_line2 TEXT DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT '',
  postal_code TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT 'Colombia',
  
  -- Flags
  is_default BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_addresses_profile_id ON public.addresses(profile_id);

-- Una sola dirección predeterminada por usuario (la app debe desmarcar la anterior antes de marcar otra)
CREATE UNIQUE INDEX IF NOT EXISTS idx_addresses_one_default_per_profile
  ON public.addresses (profile_id)
  WHERE is_default = TRUE;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver sus propias direcciones
CREATE POLICY "Users can view own addresses"
  ON public.addresses
  FOR SELECT
  USING (auth.uid() = profile_id);

-- Los usuarios pueden insertar sus propias direcciones
CREATE POLICY "Users can insert own addresses"
  ON public.addresses
  FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

-- Los usuarios pueden actualizar sus propias direcciones
CREATE POLICY "Users can update own addresses"
  ON public.addresses
  FOR UPDATE
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- Los usuarios pueden eliminar sus propias direcciones
CREATE POLICY "Users can delete own addresses"
  ON public.addresses
  FOR DELETE
  USING (auth.uid() = profile_id);

-- Admins pueden ver todas las direcciones (para gestión de envíos)
CREATE POLICY "Admins can view all addresses"
  ON public.addresses
  FOR SELECT
  USING (is_admin());
