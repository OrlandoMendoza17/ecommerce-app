-- ============================================
-- TABLA: public.exchange_rates
-- Descripción: Tasas de cambio USD/EUR → VES
-- Modelo append-only: cada cron inserta una fila nueva.
-- La app siempre lee la fila más reciente.
-- ============================================

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

-- Lectura pública: cualquier cliente puede ver la tasa actual
CREATE POLICY "Anyone can view exchange rates"
    ON public.exchange_rates
    AS permissive FOR SELECT TO public USING (true);

-- Solo service_role puede insertar (desde el cron/API route)
CREATE POLICY "Service role can insert exchange rates"
    ON public.exchange_rates
    AS permissive FOR INSERT TO service_role WITH CHECK (true);
