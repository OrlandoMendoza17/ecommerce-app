-- =============================================================================
-- MIGRACIÓN: exchange_rates
-- Ejecutar en Supabase → SQL Editor si la BD ya existe.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.exchange_rates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    currency VARCHAR(3) NOT NULL CHECK (currency IN ('USD', 'EUR', 'VES')),
    "USD" DECIMAL(15, 4) NOT NULL,
    "EUR" DECIMAL(15, 4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_created_at
    ON public.exchange_rates(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_currency
    ON public.exchange_rates(currency);

ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'exchange_rates'
        AND policyname = 'Anyone can view exchange rates'
    ) THEN
        CREATE POLICY "Anyone can view exchange rates"
            ON public.exchange_rates
            AS permissive FOR SELECT TO public USING (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'exchange_rates'
        AND policyname = 'Service role can insert exchange rates'
    ) THEN
        CREATE POLICY "Service role can insert exchange rates"
            ON public.exchange_rates
            AS permissive FOR INSERT TO service_role WITH CHECK (true);
    END IF;
END $$;
