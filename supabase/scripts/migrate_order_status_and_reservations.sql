-- =============================================================================
-- MIGRACIÓN: estados de pedido + reservas de stock
-- Ejecutar en Supabase → SQL Editor si la BD ya existe.
-- =============================================================================

-- 1. reserved_quantity en variantes
ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS reserved_quantity INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.product_variants
  DROP CONSTRAINT IF EXISTS product_variants_reserved_lte_stock;

ALTER TABLE public.product_variants
  ADD CONSTRAINT product_variants_reserved_lte_stock
  CHECK (reserved_quantity >= 0 AND (reserved_quantity <= stock_quantity OR allow_backorder = TRUE));

-- 2. Migrar estados legacy de orders
UPDATE public.orders SET status = 'pending_payment' WHERE status = 'pending';
UPDATE public.orders SET status = 'payment_confirmed' WHERE status = 'processing';

-- 3. Ampliar payment_status
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN ('pending', 'submitted', 'confirmed', 'failed'));

-- 4. Nuevos status en orders
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders
  ALTER COLUMN status SET DEFAULT 'pending_payment';
ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending_payment',
    'payment_submitted',
    'payment_confirmed',
    'shipped',
    'delivered',
    'cancelled',
    'refunded'
  ));

-- 5. Índice para expiración
CREATE INDEX IF NOT EXISTS idx_orders_pending_payment_expiry
  ON public.orders(created_at)
  WHERE status = 'pending_payment';

-- 6. RLS: actualizar policy de reporte de pago
DROP POLICY IF EXISTS "Users can submit payment on own pending orders" ON public.orders;
CREATE POLICY "Users can submit payment on own pending orders"
  ON public.orders
  FOR UPDATE
  USING (auth.uid() = profile_id AND status = 'pending_payment')
  WITH CHECK (auth.uid() = profile_id);

-- 7. Funciones RPC (ejecutar archivos standalone en orden)
-- create_order_from_cart.sql
-- submit_order_payment.sql (reemplaza versión anterior)
-- confirm_order_payment.sql
-- cancel_order.sql
-- expire_pending_orders.sql
