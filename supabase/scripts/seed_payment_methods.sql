-- ============================================
-- SCRIPT: Seed de Métodos de Pago
-- Descripción: Inserta métodos de pago de ejemplo
-- ============================================
-- NOTA: Personaliza estos datos según tus necesidades

-- ============================================
-- TRANSFERENCIA BANCARIA
-- ============================================

INSERT INTO public.payment_methods (
  name,
  code,
  description,
  payment_details,
  instructions,
  requires_reference,
  requires_proof,
  currency,
  display_order,
  is_active
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
  E'1. Realiza la transferencia a la cuenta indicada\n2. Guarda el comprobante\n3. Sube la captura de pantalla en el siguiente paso\n4. Procesaremos tu pedido en las próximas 24 horas',
  TRUE,
  TRUE,
  'VES',
  1,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  payment_details = EXCLUDED.payment_details,
  instructions = EXCLUDED.instructions,
  currency = EXCLUDED.currency,
  updated_at = NOW();

-- ============================================
-- PAGO MÓVIL
-- ============================================

INSERT INTO public.payment_methods (
  name,
  code,
  description,
  payment_details,
  instructions,
  requires_reference,
  requires_proof,
  currency,
  display_order,
  is_active
) VALUES (
  'Pago Móvil',
  'mobile_payment',
  'Paga desde tu app bancaria móvil',
  '{
    "bank": "Banco Nacional",
    "phone": "0424-1234567",
    "id_number": "V-12345678",
    "owner_name": "Nombre Titular"
  }'::JSONB,
  E'1. Abre tu app bancaria\n2. Selecciona Pago Móvil\n3. Ingresa los datos indicados\n4. Sube la captura del comprobante\n5. Tu pedido se procesará en 24 horas',
  TRUE,
  TRUE,
  'VES',
  2,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  payment_details = EXCLUDED.payment_details,
  instructions = EXCLUDED.instructions,
  currency = EXCLUDED.currency,
  updated_at = NOW();

-- ============================================
-- ZELLE (EJEMPLO INTERNACIONAL)
-- ============================================

INSERT INTO public.payment_methods (
  name,
  code,
  description,
  payment_details,
  instructions,
  requires_reference,
  requires_proof,
  currency,
  display_order,
  is_active
) VALUES (
  'Zelle',
  'zelle',
  'Pago mediante Zelle (solo USA)',
  '{
    "email": "pagos@miempresa.com",
    "phone": "+1-555-123-4567"
  }'::JSONB,
  E'1. Abre tu app de Zelle\n2. Envía el pago al email o teléfono indicado\n3. Copia el número de confirmación\n4. Ingresa el número de confirmación en el siguiente paso',
  TRUE,
  FALSE,
  'USD',
  3,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  payment_details = EXCLUDED.payment_details,
  instructions = EXCLUDED.instructions,
  currency = EXCLUDED.currency,
  updated_at = NOW();

-- ============================================
-- ZINLI
-- ============================================

INSERT INTO public.payment_methods (
  name,
  code,
  description,
  payment_details,
  instructions,
  requires_reference,
  requires_proof,
  currency,
  display_order,
  is_active
) VALUES (
  'Zinli',
  'zinli',
  'Paga con tu cuenta Zinli',
  '{
    "user": "@miempresa",
    "email": "pagos@miempresa.com",
    "phone": "+58-424-1234567"
  }'::JSONB,
  E'1. Abre tu app de Zinli\n2. Envía el pago al usuario indicado\n3. Copia el número de confirmación\n4. Sube la captura del comprobante\n5. Tu pedido se procesará en 24 horas',
  TRUE,
  TRUE,
  'USD',
  4,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  payment_details = EXCLUDED.payment_details,
  instructions = EXCLUDED.instructions,
  currency = EXCLUDED.currency,
  updated_at = NOW();

-- ============================================
-- BINANCE
-- ============================================

INSERT INTO public.payment_methods (
  name,
  code,
  description,
  payment_details,
  instructions,
  requires_reference,
  requires_proof,
  currency,
  display_order,
  is_active
) VALUES (
  'Binance',
  'binance',
  'Pago con criptomonedas vía Binance',
  '{
    "binance_id": "123456789",
    "email": "pagos@miempresa.com",
    "accepted_coins": ["USDT", "BUSD", "BTC"]
  }'::JSONB,
  E'1. Abre tu app de Binance\n2. Selecciona P2P o transferencia\n3. Envía a la cuenta indicada\n4. Copia el hash de transacción (TxID)\n5. Sube la captura del comprobante\n6. Tu pedido se procesará en 24 horas',
  TRUE,
  TRUE,
  'USD',
  5,
  TRUE
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  payment_details = EXCLUDED.payment_details,
  instructions = EXCLUDED.instructions,
  currency = EXCLUDED.currency,
  updated_at = NOW();

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
    RAISE NOTICE 'Métodos de pago creados/actualizados:';
    RAISE NOTICE '  ✓ Transferencia Bancaria (activo)';
    RAISE NOTICE '  ✓ Pago Móvil (activo)';
    RAISE NOTICE '  ✓ Zelle (activo)';
    RAISE NOTICE '  ✓ Zinli (activo)';
    RAISE NOTICE '  ✓ Binance (activo)';
    RAISE NOTICE '';
    RAISE NOTICE '📝 SIGUIENTE PASO:';
    RAISE NOTICE '   Edita los payment_details con tus datos reales';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 PERSONALIZAR:';
    RAISE NOTICE '   UPDATE payment_methods';
    RAISE NOTICE '   SET payment_details = ''{"bank": "Tu Banco", ...}''::JSONB';
    RAISE NOTICE '   WHERE code = ''bank_transfer'';';
    RAISE NOTICE '';
END $$;

-- ============================================
-- QUERY DE VERIFICACIÓN
-- ============================================

-- Ver todos los métodos de pago activos
-- SELECT name, code, is_active, display_order 
-- FROM payment_methods 
-- ORDER BY display_order;

