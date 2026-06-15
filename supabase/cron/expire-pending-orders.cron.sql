-- =============================================================================
-- CRON: expire-pending-orders
-- Cancela pedidos sin pago reportado después de 48 horas y libera reservas.
-- =============================================================================
--
-- REQUISITOS (Supabase Pro): pg_cron
--
-- Ejecutar en Supabase → SQL Editor después de desplegar expire_pending_orders().
-- =============================================================================

DO $$
BEGIN
    PERFORM cron.unschedule('expire-pending-orders');
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Cada hora revisa pedidos expirados (48h sin reportar pago)
SELECT cron.schedule(
    'expire-pending-orders',
    '0 * * * *',
    $$SELECT public.expire_pending_orders(48)$$
);

-- Verificar:
-- SELECT * FROM cron.job WHERE jobname = 'expire-pending-orders';
