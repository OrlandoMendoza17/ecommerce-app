-- ============================================
-- TABLA: public.payment_methods
-- Descripción: Métodos de pago disponibles (transferencia, pago móvil, etc.)
-- ============================================

CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL DEFAULT '',
  type VARCHAR(50) NOT NULL DEFAULT 'pago_movil' CHECK (type IN ('pago_movil', 'zinli', 'zelle', 'binance', 'transferencia_bancaria')),
  payment_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_payment_methods_type ON public.payment_methods(type);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_active ON public.payment_methods(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_methods_deleted_at ON public.payment_methods(deleted_at) WHERE deleted_at IS NULL;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver métodos de pago activos (no eliminados)
CREATE POLICY "Anyone can view active payment methods"
  ON public.payment_methods
  FOR SELECT
  USING (is_active = TRUE AND deleted_at IS NULL);

-- Admins pueden ver todos los métodos
CREATE POLICY "Admins can view all payment methods"
  ON public.payment_methods
  FOR SELECT
  USING (is_admin());

-- Admins pueden insertar métodos de pago
CREATE POLICY "Admins can insert payment methods"
  ON public.payment_methods
  FOR INSERT
  WITH CHECK (is_admin());

-- Admins pueden actualizar métodos de pago
CREATE POLICY "Admins can update payment methods"
  ON public.payment_methods
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admins pueden eliminar métodos de pago
CREATE POLICY "Admins can delete payment methods"
  ON public.payment_methods
  FOR DELETE
  USING (is_admin());
-- ============================================
-- DATOS DE EJEMPLO (COMENTADOS)
-- ============================================

/*
INSERT INTO public.payment_methods (name, type, payment_details) VALUES (
  'Transferencia Bancaria',
  'transferencia_bancaria',
  '{
    "bank": "Banco Nacional",
    "account_type": "Cuenta Corriente",
    "account_number": "0102-1234-5678-9012",
    "owner_name": "Mi Empresa S.A.",
    "rif": "J-12345678-9"
  }'::jsonb
);

INSERT INTO public.payment_methods (name, type, payment_details) VALUES (
  'Pago Móvil',
  'pago_movil',
  '{
    "bank": "Banco Nacional",
    "phone": "0424-1234567",
    "id_number": "V-12345678",
    "owner_name": "Nombre Titular"
  }'::jsonb
);

INSERT INTO public.payment_methods (name, type, payment_details) VALUES (
  'Zelle',
  'zelle',
  '{
    "email": "pagos@miempresa.com",
    "phone": "+1-555-123-4567"
  }'::jsonb
);
*/
