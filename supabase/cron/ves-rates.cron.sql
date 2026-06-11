-- =============================================================================
-- CRON: ves-rates
-- Actualiza tasas USD/EUR → VES llamando al endpoint de Next.js.
-- =============================================================================
--
-- REQUISITOS (Supabase Pro):
--   - Extensión pg_cron
--   - Extensión pg_net
--
-- ANTES DE EJECUTAR:
--   1. Desplegar la app con GET /api/cron/ves-rates accesible.
--   2. Reemplazar TU-DOMINIO.vercel.app por tu dominio de producción.
--   3. Reemplazar TU_EXCHANGE_RATES_API_KEY por el valor de EXCHANGE_RATES_API_KEY
--      (generar con: npm run generate-exchange-rates-api-key)
--   4. Ejecutar este archivo en Supabase → SQL Editor.
--
-- Horario: 6:00 AM UTC = 2:00 AM Venezuela (UTC-4)
-- =============================================================================

-- Eliminar job previo si existe
DO $$
BEGIN
    PERFORM cron.unschedule('ves-rates');
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Programar job diario
SELECT cron.schedule(
    'ves-rates',
    '0 6 * * *',
    $$SELECT net.http_get(
        url := 'https://TU-DOMINIO.vercel.app/api/cron/ves-rates',
        headers := jsonb_build_object('x-api-key', 'TU_EXCHANGE_RATES_API_KEY'),
        timeout_milliseconds := 10000
    )$$
);

-- Verificar que quedó programado:
-- SELECT * FROM cron.job WHERE jobname = 'ves-rates';
