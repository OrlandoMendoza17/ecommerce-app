-- =============================================================================
-- CRON: expire-pending-orders
-- Cancela pedidos sin pago reportado después de 48 horas, libera reservas de
-- stock y notifica al admin por correo electrónico.
-- =============================================================================
--
-- REQUISITOS (Supabase Pro):
--   - Extensión pg_cron
--   - Extensión pg_net
--
-- ANTES DE EJECUTAR:
--   1. Desplegar la app con GET /api/cron/expire-orders accesible.
--   2. Reemplazar TU-DOMINIO por tu dominio de producción.
--   3. Reemplazar CRON_API_KEY por el valor de la variable de entorno CRON_API_KEY.
--   4. Ejecutar este archivo en Supabase → SQL Editor.
--
-- Horario: cada hora en punto
-- =============================================================================

DO $$
BEGIN
    PERFORM cron.unschedule('expire-pending-orders');
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Cada hora llama al endpoint de Next.js que cancela pedidos y envía email al admin
SELECT cron.schedule(
    'expire-pending-orders',
    '0 * * * *',
    $$SELECT net.http_get(
        url := 'https://TU-DOMINIO/api/cron/expire-orders',
        headers := jsonb_build_object('x-api-key', 'CRON_API_KEY'),
        timeout_milliseconds := 15000
    )$$
);

-- Verificar:
-- SELECT * FROM cron.job WHERE jobname = 'expire-pending-orders';
