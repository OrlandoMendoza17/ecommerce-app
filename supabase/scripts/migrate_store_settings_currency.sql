-- =============================================================================
-- MIGRACIÓN: add currency to store_settings
-- Descripción: Añade el campo `currency` a store_settings para configurar
--              la moneda principal de la tienda (USD o EUR).
--              El valor determina qué columna de exchange_rates se usa
--              para calcular el equivalente en Bs.
-- =============================================================================

ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'USD'
  CONSTRAINT store_settings_currency_check CHECK (currency IN ('USD', 'EUR'));

-- Asegura que la fila existente tenga el valor por defecto
UPDATE public.store_settings SET currency = 'USD' WHERE currency IS NULL;
