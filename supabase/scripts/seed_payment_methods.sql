-- ============================================
-- SCRIPT: Seed de Métodos de Pago
-- Descripción: Inserta métodos de pago de ejemplo
-- ============================================
-- NOTA: Personaliza payment_details con tus datos reales

-- ============================================
-- TRANSFERENCIA BANCARIA
-- ============================================

INSERT INTO public.payment_methods (name, type, payment_details, is_active)
SELECT
  'Transferencia Bancaria',
  'transferencia_bancaria',
  '{
    "bank": "Banco Nacional",
    "account_type": "Cuenta Corriente",
    "account_number": "0102-1234-5678-9012",
    "owner_name": "Mi Empresa S.A.",
    "rif": "J-12345678-9"
  }'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.payment_methods
  WHERE type = 'transferencia_bancaria' AND deleted_at IS NULL
);

-- ============================================
-- PAGO MÓVIL
-- ============================================

INSERT INTO public.payment_methods (name, type, payment_details, is_active)
SELECT
  'Pago Móvil',
  'pago_movil',
  '{
    "bank": "Banco Nacional",
    "phone": "0424-1234567",
    "id_number": "V-12345678",
    "owner_name": "Nombre Titular"
  }'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.payment_methods
  WHERE type = 'pago_movil' AND deleted_at IS NULL
);

-- ============================================
-- ZELLE
-- ============================================

INSERT INTO public.payment_methods (name, type, payment_details, is_active)
SELECT
  'Zelle',
  'zelle',
  '{
    "email": "pagos@miempresa.com",
    "phone": "+1-555-123-4567"
  }'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.payment_methods
  WHERE type = 'zelle' AND deleted_at IS NULL
);

-- ============================================
-- ZINLI
-- ============================================

INSERT INTO public.payment_methods (name, type, payment_details, is_active)
SELECT
  'Zinli',
  'zinli',
  '{
    "user": "@miempresa",
    "email": "pagos@miempresa.com",
    "phone": "+58-424-1234567"
  }'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.payment_methods
  WHERE type = 'zinli' AND deleted_at IS NULL
);

-- ============================================
-- BINANCE
-- ============================================

INSERT INTO public.payment_methods (name, type, payment_details, is_active)
SELECT
  'Binance',
  'binance',
  '{
    "binance_id": "123456789",
    "email": "pagos@miempresa.com",
    "accepted_coins": ["USDT", "BUSD", "BTC"]
  }'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.payment_methods
  WHERE type = 'binance' AND deleted_at IS NULL
);

-- ============================================
-- VERIFICACIÓN
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════';
    RAISE NOTICE '✅ MÉTODOS DE PAGO INSERTADOS';
    RAISE NOTICE '═══════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE 'Métodos de pago creados:';
    RAISE NOTICE '  ✓ transferencia_bancaria';
    RAISE NOTICE '  ✓ pago_movil';
    RAISE NOTICE '  ✓ zelle';
    RAISE NOTICE '  ✓ zinli';
    RAISE NOTICE '  ✓ binance';
    RAISE NOTICE '';
    RAISE NOTICE '📝 SIGUIENTE PASO:';
    RAISE NOTICE '   Edita payment_details con tus datos reales';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 PERSONALIZAR:';
    RAISE NOTICE '   UPDATE payment_methods';
    RAISE NOTICE '   SET payment_details = ''{"bank": "Tu Banco", ...}''::jsonb';
    RAISE NOTICE '   WHERE type = ''transferencia_bancaria'' AND deleted_at IS NULL;';
    RAISE NOTICE '';
END $$;

-- SELECT name, type, is_active FROM payment_methods WHERE deleted_at IS NULL ORDER BY type;
