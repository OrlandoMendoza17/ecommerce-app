-- ============================================
-- TABLA: public.payment_methods
-- Descripción: Métodos de pago disponibles (transferencia, pago móvil, etc.)
-- ============================================

-- Crear ENUM para monedas si no existe
DO $$ BEGIN
  CREATE TYPE currency_type AS ENUM ('USD', 'VES');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Información del método
  name TEXT NOT NULL DEFAULT '', -- Ej: "Transferencia Bancaria", "Pago Móvil", "Zelle"
  code TEXT NOT NULL UNIQUE DEFAULT '', -- Código único (ej: "bank_transfer", "mobile_payment")
  description TEXT DEFAULT '', -- Descripción para mostrar al cliente
  
  -- Datos para el pago (JSONB para flexibilidad)
  payment_details JSONB DEFAULT '{}'::JSONB, -- Ej: {"bank": "Banco X", "account": "0102-xxxx-xxxx", "owner": "Nombre Empresa"}
  
  -- Instrucciones
  instructions TEXT DEFAULT '', -- Instrucciones paso a paso para el cliente
  
  -- Configuración
  requires_reference BOOLEAN DEFAULT TRUE, -- Si requiere número de referencia/transacción
  requires_proof BOOLEAN DEFAULT TRUE, -- Si requiere captura de comprobante
  currency currency_type NOT NULL DEFAULT 'VES', -- Moneda del método de pago (USD o VES)
  
  -- Estado
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0, -- Orden de visualización en el checkout
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_payment_methods_code ON public.payment_methods(code);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_active ON public.payment_methods(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_methods_display_order ON public.payment_methods(display_order);
CREATE INDEX IF NOT EXISTS idx_payment_methods_currency ON public.payment_methods(currency);

-- Índice compuesto para filtrar por moneda y estado activo
CREATE INDEX IF NOT EXISTS idx_payment_methods_currency_active ON public.payment_methods(currency, is_active) WHERE is_active = TRUE;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver métodos de pago activos
CREATE POLICY "Anyone can view active payment methods"
  ON public.payment_methods
  FOR SELECT
  USING (is_active = TRUE);

-- Admins pueden ver todos los métodos
CREATE POLICY "Admins can view all payment methods"
  ON public.payment_methods
  FOR SELECT
  USING (is_admin());

-- Admins pueden insertar métodos de pago
CREATE POLICY "Admins can insert payment methods"
  ON public.payment_methods
  FOR INSERT
  WITH CHECK (has_admin_permission('orders'));

-- Admins pueden actualizar métodos de pago
CREATE POLICY "Admins can update payment methods"
  ON public.payment_methods
  FOR UPDATE
  USING (has_admin_permission('orders'))
  WITH CHECK (has_admin_permission('orders'));

-- Admins pueden eliminar métodos de pago
CREATE POLICY "Admins can delete payment methods"
  ON public.payment_methods
  FOR DELETE
  USING (has_admin_permission('orders'));

-- ============================================
-- TRIGGER PARA UPDATED_AT
-- ============================================

CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- DATOS DE EJEMPLO (COMENTADOS)
-- ============================================

-- NOTA: Descomenta y personaliza según tus necesidades

/*
-- Transferencia Bancaria
INSERT INTO public.payment_methods (
  name,
  code,
  description,
  payment_details,
  instructions,
  display_order
) VALUES (
  'Transferencia Bancaria',
  'bank_transfer',
  'Realiza una transferencia desde tu banco',
  '{
    "bank": "Banco Nacional",
    "account_type": "Cuenta Corriente",
    "account_number": "0102-1234-5678-9012",
    "owner_name": "Mi Empresa S.A.",
    "rif": "J-12345678-9"
  }'::JSONB,
  'Por favor realiza la transferencia y sube el comprobante. Procesaremos tu pedido en las próximas 24 horas.',
  1
);

-- Pago Móvil
INSERT INTO public.payment_methods (
  name,
  code,
  description,
  payment_details,
  instructions,
  display_order
) VALUES (
  'Pago Móvil',
  'mobile_payment',
  'Paga desde tu app bancaria',
  '{
    "bank": "Banco Nacional",
    "phone": "0424-1234567",
    "id_number": "V-12345678",
    "owner_name": "Nombre Titular"
  }'::JSONB,
  'Realiza el pago móvil y sube la captura de pantalla con el comprobante.',
  2
);

-- Zelle (ejemplo internacional)
INSERT INTO public.payment_methods (
  name,
  code,
  description,
  payment_details,
  instructions,
  display_order
) VALUES (
  'Zelle',
  'zelle',
  'Pago mediante Zelle',
  '{
    "email": "pagos@miempresa.com",
    "phone": "+1-555-123-4567"
  }'::JSONB,
  'Envía el pago vía Zelle y proporciona el número de confirmación.',
  3
);
*/

