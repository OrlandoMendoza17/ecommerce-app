-- ============================================
-- TABLA: orders
-- Descripción: Órdenes de compra
-- ============================================

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  
  -- Número de orden legible
  order_number TEXT NOT NULL UNIQUE DEFAULT '',
  
  -- Estado
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'payment_confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded'
  )),
  
  -- Totales
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  tax DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (tax >= 0),
  shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
  discount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  total DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  
  -- Información de envío (desnormalizada para mantener histórico)
  shipping_full_name TEXT NOT NULL DEFAULT '',
  shipping_phone TEXT NOT NULL DEFAULT '',
  shipping_address_line1 TEXT NOT NULL DEFAULT '',
  shipping_address_line2 TEXT NOT NULL DEFAULT '',
  shipping_city TEXT NOT NULL DEFAULT '',
  shipping_state TEXT NOT NULL DEFAULT '',
  shipping_postal_code TEXT NOT NULL DEFAULT '',
  shipping_country TEXT NOT NULL DEFAULT '',
  
  -- Información de pago
  payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL, -- Método de pago seleccionado
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'confirmed', 'failed')),
  payment_reference TEXT NOT NULL DEFAULT '', -- Número de referencia/transacción del pago
  payment_proof_url TEXT NOT NULL DEFAULT '', -- URL de la captura del comprobante de pago (Supabase Storage)
  paid_at TIMESTAMPTZ,
  
  -- Información de envío
  tracking_number TEXT NOT NULL DEFAULT '',
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  
  -- Notas
  customer_notes TEXT NOT NULL DEFAULT '',
  admin_notes TEXT NOT NULL DEFAULT '',
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_orders_profile_id ON public.orders(profile_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method_id ON public.orders(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_profile_status ON public.orders(profile_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_tracking ON public.orders(tracking_number) WHERE tracking_number <> '';

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver sus propias órdenes
CREATE POLICY "Users can view own orders"
  ON public.orders
  FOR SELECT
  USING (auth.uid() = profile_id);

-- Los usuarios pueden crear órdenes
CREATE POLICY "Users can create orders"
  ON public.orders
  FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

-- Admins pueden ver todas las órdenes
CREATE POLICY "Admins can view all orders"
  ON public.orders
  FOR SELECT
  USING (is_admin());

-- Admins pueden actualizar órdenes (cambiar estado, tracking, etc.)
CREATE POLICY "Admins can update orders"
  ON public.orders
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Lógica servidor: docs/server_logic_checklist.md (order_number, fechas de status)
