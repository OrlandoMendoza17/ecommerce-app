-- =============================================================================
-- MIGRACIÓN: brands + products.brand TEXT → brand_id UUID
-- Ejecutar en Supabase → SQL Editor si la BD ya existe.
-- Requiere: función is_admin() (igual que categories).
-- =============================================================================

-- 1. Tabla brands
CREATE TABLE IF NOT EXISTS public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brands_name ON public.brands(name);
CREATE INDEX IF NOT EXISTS idx_brands_is_active ON public.brands(is_active);
CREATE INDEX IF NOT EXISTS idx_brands_display_order ON public.brands(display_order);

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'brands'
      AND policyname = 'Anyone can view active brands'
  ) THEN
    CREATE POLICY "Anyone can view active brands"
      ON public.brands FOR SELECT
      USING (is_active = TRUE);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'brands'
      AND policyname = 'Admins can view all brands'
  ) THEN
    CREATE POLICY "Admins can view all brands"
      ON public.brands FOR SELECT
      USING (is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'brands'
      AND policyname = 'Admins can insert brands'
  ) THEN
    CREATE POLICY "Admins can insert brands"
      ON public.brands FOR INSERT
      WITH CHECK (is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'brands'
      AND policyname = 'Admins can update brands'
  ) THEN
    CREATE POLICY "Admins can update brands"
      ON public.brands FOR UPDATE
      USING (is_admin())
      WITH CHECK (is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'brands'
      AND policyname = 'Admins can delete brands'
  ) THEN
    CREATE POLICY "Admins can delete brands"
      ON public.brands FOR DELETE
      USING (is_admin());
  END IF;
END $$;

-- 2. Columna brand_id en products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_brand_id ON public.products(brand_id);

-- 3. Sembrar marcas desde valores distintos de products.brand (si la columna aún existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'brand'
  ) THEN
    INSERT INTO public.brands (name, is_active)
    SELECT DISTINCT trim(p.brand), TRUE
    FROM public.products p
    WHERE trim(p.brand) <> ''
      AND NOT EXISTS (
        SELECT 1 FROM public.brands b
        WHERE lower(b.name) = lower(trim(p.brand))
      );

    UPDATE public.products p
    SET brand_id = b.id
    FROM public.brands b
    WHERE p.brand_id IS NULL
      AND trim(p.brand) <> ''
      AND lower(b.name) = lower(trim(p.brand));

    DROP INDEX IF EXISTS public.idx_products_brand;
    ALTER TABLE public.products DROP COLUMN brand;
  END IF;
END $$;
