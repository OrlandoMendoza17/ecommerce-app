-- =============================================================================
-- VERIFICAR Y SINCRONIZAR ESQUEMA — tablas del catálogo / carrito / pedidos
-- =============================================================================
-- Compara columnas en la BD desplegada vs supabase/tables/*.sql del proyecto.
--
-- USO (Supabase SQL Editor):
--   1) Ejecuta solo la PARTE 1 → revisa el reporte de drift.
--   2) Haz backup.
--   3) Ejecuta la PARTE 2 → crea tablas faltantes, columnas, índices; elimina legacy.
--
-- Tablas cubiertas:
--   products, product_option_types, product_option_values, product_variants,
--   variant_option_values, cart_items, orders, order_items
--
-- Limitaciones:
--   - No reescribe tipos distintos automáticamente (solo ADD/DROP columnas).
--   - CHECK/FK/UNIQUE: se recrean índices y constraints clave; revisa el reporte.
--   - cart_items.variant_id requiere backfill si vienes de esquema legacy (ver PARTE 3).
-- =============================================================================

-- =============================================================================
-- PARTE 1 — REPORTE DE DRIFT (solo lectura)
-- =============================================================================

WITH expected AS (
  SELECT * FROM (VALUES
    -- products
    ('products', 'id'), ('products', 'category_id'), ('products', 'brand_id'),
    ('products', 'name'),
    ('products', 'slug'), ('products', 'description'), ('products', 'price'),
    ('products', 'compare_at_price'), ('products', 'condition'),
    ('products', 'is_digital'), ('products', 'tags'), ('products', 'attributes'),
    ('products', 'images'), ('products', 'meta_title'), ('products', 'meta_description'),
    ('products', 'is_active'), ('products', 'is_featured'),
    ('products', 'created_at'), ('products', 'updated_at'),
    -- brands
    ('brands', 'id'), ('brands', 'name'), ('brands', 'image_url'),
    ('brands', 'display_order'), ('brands', 'is_active'),
    ('brands', 'created_at'), ('brands', 'updated_at'),
    -- product_option_types
    ('product_option_types', 'id'), ('product_option_types', 'product_id'),
    ('product_option_types', 'name'), ('product_option_types', 'display_order'),
    ('product_option_types', 'created_at'), ('product_option_types', 'updated_at'),
    -- product_option_values
    ('product_option_values', 'id'), ('product_option_values', 'option_type_id'),
    ('product_option_values', 'value'), ('product_option_values', 'display_order'),
    ('product_option_values', 'created_at'), ('product_option_values', 'updated_at'),
    -- product_variants
    ('product_variants', 'id'), ('product_variants', 'product_id'),
    ('product_variants', 'sku'), ('product_variants', 'price'),
    ('product_variants', 'compare_at_price'), ('product_variants', 'cost'),
    ('product_variants', 'stock_quantity'), ('product_variants', 'low_stock_threshold'),
    ('product_variants', 'allow_backorder'), ('product_variants', 'images'),
    ('product_variants', 'is_active'), ('product_variants', 'created_at'),
    ('product_variants', 'updated_at'),
    -- variant_option_values
    ('variant_option_values', 'variant_id'), ('variant_option_values', 'option_value_id'),
    -- cart_items
    ('cart_items', 'id'), ('cart_items', 'cart_id'), ('cart_items', 'product_id'),
    ('cart_items', 'variant_id'), ('cart_items', 'quantity'),
    ('cart_items', 'customization_text'), ('cart_items', 'customization_notes'),
    ('cart_items', 'created_at'), ('cart_items', 'updated_at'),
    -- orders
    ('orders', 'id'), ('orders', 'profile_id'), ('orders', 'order_number'),
    ('orders', 'status'), ('orders', 'subtotal'), ('orders', 'tax'),
    ('orders', 'shipping_cost'), ('orders', 'discount'), ('orders', 'total'),
    ('orders', 'shipping_full_name'), ('orders', 'shipping_phone'),
    ('orders', 'shipping_address_line1'), ('orders', 'shipping_address_line2'),
    ('orders', 'shipping_city'), ('orders', 'shipping_state'),
    ('orders', 'shipping_postal_code'), ('orders', 'shipping_country'),
    ('orders', 'payment_method_id'), ('orders', 'payment_status'),
    ('orders', 'payment_reference'), ('orders', 'payment_proof_url'),
    ('orders', 'paid_at'), ('orders', 'tracking_number'), ('orders', 'shipped_at'),
    ('orders', 'delivered_at'), ('orders', 'customer_notes'), ('orders', 'admin_notes'),
    ('orders', 'created_at'), ('orders', 'updated_at'),
    -- order_items
    ('order_items', 'id'), ('order_items', 'order_id'), ('order_items', 'product_id'),
    ('order_items', 'variant_id'), ('order_items', 'product_name'),
    ('order_items', 'product_sku'), ('order_items', 'product_image_url'),
    ('order_items', 'variant_sku'), ('order_items', 'selected_options'),
    ('order_items', 'quantity'), ('order_items', 'unit_price'), ('order_items', 'subtotal'),
    ('order_items', 'customization_text'), ('order_items', 'customization_notes'),
    ('order_items', 'created_at')
  ) AS t(table_name, column_name)
),
actual AS (
  SELECT table_name, column_name
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name IN (
      'products', 'product_option_types', 'product_option_values',
      'product_variants', 'variant_option_values',
      'cart_items', 'orders', 'order_items'
    )
),
legacy_columns AS (
  SELECT * FROM (VALUES
    ('products', 'sku'),
    ('products', 'cost'),
    ('products', 'stock_quantity'),
    ('products', 'low_stock_threshold'),
    ('products', 'allow_backorder'),
    ('products', 'material'),
    ('products', 'short_description'),
    ('products', 'dimension_options'),
    ('products', 'thickness_options'),
    ('cart_items', 'selected_dimension'),
    ('cart_items', 'selected_thickness'),
    ('order_items', 'selected_dimension'),
    ('order_items', 'selected_thickness')
  ) AS t(table_name, column_name)
)
SELECT 'MISSING_IN_DB' AS drift_type, e.table_name, e.column_name,
       'Falta en la BD; PARTE 2 la agregará o creará la tabla' AS accion
  FROM expected e
  LEFT JOIN actual a
    ON a.table_name = e.table_name AND a.column_name = e.column_name
 WHERE a.column_name IS NULL

UNION ALL

SELECT 'EXTRA_IN_DB (legacy)' AS drift_type, l.table_name, l.column_name,
       'Sobra vs proyecto; PARTE 2 la eliminará' AS accion
  FROM legacy_columns l
  JOIN actual a
    ON a.table_name = l.table_name AND a.column_name = l.column_name

UNION ALL

SELECT 'EXTRA_IN_DB (otra)' AS drift_type, a.table_name, a.column_name,
       'No está en la definición del proyecto; revisar manualmente' AS accion
  FROM actual a
  LEFT JOIN expected e
    ON e.table_name = a.table_name AND e.column_name = a.column_name
 WHERE e.column_name IS NULL
   AND NOT EXISTS (
     SELECT 1 FROM legacy_columns l
      WHERE l.table_name = a.table_name AND l.column_name = a.column_name
   )

ORDER BY drift_type, table_name, column_name;

-- Resumen por tabla
SELECT
  t.table_name,
  EXISTS (
    SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = t.table_name
  ) AS tabla_existe,
  (
    SELECT COUNT(*) FROM information_schema.columns c
     WHERE c.table_schema = 'public' AND c.table_name = t.table_name
  ) AS columnas_actuales,
  (
    SELECT COUNT(*) FROM expected e WHERE e.table_name = t.table_name
  ) AS columnas_esperadas
FROM (SELECT DISTINCT table_name FROM expected) t
ORDER BY t.table_name;


-- =============================================================================
-- PARTE 2 — SINCRONIZAR (ejecutar tras revisar PARTE 1)
-- =============================================================================

BEGIN;

-- ── 2.0 brands ───────────────────────────────────────────────────────────────

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

-- ── 2.1 products ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  name TEXT NOT NULL DEFAULT '',
  slug TEXT NOT NULL UNIQUE DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  price DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  compare_at_price DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (compare_at_price >= 0),
  condition TEXT NOT NULL DEFAULT 'new',
  is_digital BOOLEAN NOT NULL DEFAULT FALSE,
  tags TEXT[] NOT NULL DEFAULT '{}',
  attributes JSONB NOT NULL DEFAULT '{}'::JSONB,
  images JSONB NOT NULL DEFAULT '[]'::JSONB,
  meta_title TEXT NOT NULL DEFAULT '',
  meta_description TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS condition TEXT NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS is_digital BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS attributes JSONB NOT NULL DEFAULT '{}'::JSONB;

DROP INDEX IF EXISTS public.idx_products_brand;
ALTER TABLE public.products DROP COLUMN IF EXISTS brand;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'products_condition_check'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_condition_check
      CHECK (condition IN ('new', 'used', 'refurbished'));
  END IF;
END $$;

ALTER TABLE public.products
  DROP COLUMN IF EXISTS sku,
  DROP COLUMN IF EXISTS cost,
  DROP COLUMN IF EXISTS stock_quantity,
  DROP COLUMN IF EXISTS low_stock_threshold,
  DROP COLUMN IF EXISTS allow_backorder,
  DROP COLUMN IF EXISTS material,
  DROP COLUMN IF EXISTS short_description,
  DROP COLUMN IF EXISTS dimension_options,
  DROP COLUMN IF EXISTS thickness_options;

CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON public.products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);
CREATE INDEX IF NOT EXISTS idx_products_condition ON public.products(condition);
CREATE INDEX IF NOT EXISTS idx_products_tags ON public.products USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_products_attributes ON public.products USING GIN (attributes);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_active_category ON public.products(is_active, category_id)
  WHERE is_active = TRUE;

DROP INDEX IF EXISTS public.idx_products_sku;
DROP INDEX IF EXISTS public.idx_products_stock;

-- ── 2.2 product_option_types ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.product_option_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0 CHECK (display_order >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, name)
);

CREATE INDEX IF NOT EXISTS idx_product_option_types_product_id
  ON public.product_option_types(product_id);

-- ── 2.3 product_option_values ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.product_option_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_type_id UUID NOT NULL
    REFERENCES public.product_option_types(id) ON DELETE CASCADE,
  value TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0 CHECK (display_order >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (option_type_id, value)
);

CREATE INDEX IF NOT EXISTS idx_product_option_values_option_type_id
  ON public.product_option_values(option_type_id);

-- ── 2.4 product_variants ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku TEXT NOT NULL DEFAULT '',
  price DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  compare_at_price DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (compare_at_price >= 0),
  cost DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (cost >= 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  low_stock_threshold INTEGER NOT NULL DEFAULT 0 CHECK (low_stock_threshold >= 0),
  allow_backorder BOOLEAN NOT NULL DEFAULT FALSE,
  images JSONB NOT NULL DEFAULT '[]'::JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_variants_sku_unique
  ON public.product_variants(sku) WHERE sku <> '';

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id
  ON public.product_variants(product_id);

CREATE INDEX IF NOT EXISTS idx_product_variants_stock
  ON public.product_variants(stock_quantity);

CREATE INDEX IF NOT EXISTS idx_product_variants_active
  ON public.product_variants(product_id, is_active) WHERE is_active = TRUE;

-- ── 2.5 variant_option_values ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.variant_option_values (
  variant_id UUID NOT NULL
    REFERENCES public.product_variants(id) ON DELETE CASCADE,
  option_value_id UUID NOT NULL
    REFERENCES public.product_option_values(id) ON DELETE CASCADE,
  PRIMARY KEY (variant_id, option_value_id)
);

CREATE INDEX IF NOT EXISTS idx_variant_option_values_variant_id
  ON public.variant_option_values(variant_id);

CREATE INDEX IF NOT EXISTS idx_variant_option_values_option_value_id
  ON public.variant_option_values(option_value_id);

-- ── 2.6 orders (columnas; tabla puede existir) ─────────────────────────────────

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  order_number TEXT NOT NULL UNIQUE DEFAULT '',
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'payment_confirmed', 'processing', 'shipped',
    'delivered', 'cancelled', 'refunded'
  )),
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  tax DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (tax >= 0),
  shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
  discount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  total DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  shipping_full_name TEXT NOT NULL DEFAULT '',
  shipping_phone TEXT NOT NULL DEFAULT '',
  shipping_address_line1 TEXT NOT NULL DEFAULT '',
  shipping_address_line2 TEXT NOT NULL DEFAULT '',
  shipping_city TEXT NOT NULL DEFAULT '',
  shipping_state TEXT NOT NULL DEFAULT '',
  shipping_postal_code TEXT NOT NULL DEFAULT '',
  shipping_country TEXT NOT NULL DEFAULT '',
  payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'confirmed', 'failed')),
  payment_reference TEXT NOT NULL DEFAULT '',
  payment_proof_url TEXT NOT NULL DEFAULT '',
  paid_at TIMESTAMPTZ,
  tracking_number TEXT NOT NULL DEFAULT '',
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  customer_notes TEXT NOT NULL DEFAULT '',
  admin_notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method_id UUID,
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_reference TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS payment_proof_url TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tracking_number TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS customer_notes TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS admin_notes TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_orders_profile_id ON public.orders(profile_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method_id ON public.orders(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_profile_status ON public.orders(profile_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_tracking ON public.orders(tracking_number)
  WHERE tracking_number <> '';

-- ── 2.7 order_items ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL DEFAULT '',
  product_sku TEXT NOT NULL DEFAULT '',
  product_image_url TEXT NOT NULL DEFAULT '',
  variant_sku TEXT NOT NULL DEFAULT '',
  selected_options JSONB NOT NULL DEFAULT '{}'::JSONB,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  customization_text TEXT NOT NULL DEFAULT '',
  customization_notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS variant_id UUID,
  ADD COLUMN IF NOT EXISTS variant_sku TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS selected_options JSONB NOT NULL DEFAULT '{}'::JSONB;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'order_items'
      AND column_name = 'selected_dimension'
  ) THEN
    UPDATE public.order_items
    SET selected_options = jsonb_strip_nulls(jsonb_build_object(
      'Dimensión', NULLIF(selected_dimension, ''),
      'Grosor', NULLIF(selected_thickness, '')
    ))
    WHERE (selected_dimension <> '' OR selected_thickness <> '')
      AND (selected_options IS NULL OR selected_options = '{}'::JSONB);
  END IF;
END $$;

ALTER TABLE public.order_items
  DROP COLUMN IF EXISTS selected_dimension,
  DROP COLUMN IF EXISTS selected_thickness;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'order_items_variant_id_fkey'
      AND conrelid = 'public.order_items'::regclass
  ) THEN
    ALTER TABLE public.order_items
      ADD CONSTRAINT order_items_variant_id_fkey
      FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON public.order_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_selected_options ON public.order_items USING GIN (selected_options);

-- ── 2.8 cart_items ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES public.cart(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  customization_text TEXT NOT NULL DEFAULT '',
  customization_notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (cart_id, variant_id)
);

ALTER TABLE public.cart_items
  ADD COLUMN IF NOT EXISTS variant_id UUID;

-- Backfill variant_id si viene de esquema legacy (requiere product_variants con datos)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cart_items'
      AND column_name = 'variant_id'
  ) AND EXISTS (
    SELECT 1 FROM public.cart_items WHERE variant_id IS NULL LIMIT 1
  ) THEN
    UPDATE public.cart_items ci
    SET variant_id = (
      SELECT pv.id FROM public.product_variants pv
      WHERE pv.product_id = ci.product_id
      ORDER BY pv.created_at ASC LIMIT 1
    )
    WHERE ci.variant_id IS NULL
      AND EXISTS (
        SELECT 1 FROM public.product_variants pv WHERE pv.product_id = ci.product_id
      );
  END IF;
END $$;

DELETE FROM public.cart_items WHERE variant_id IS NULL;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.cart_items'::regclass AND contype = 'u'
  LOOP
    EXECUTE format('ALTER TABLE public.cart_items DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cart_items'
      AND column_name = 'variant_id'
  ) THEN
    ALTER TABLE public.cart_items ALTER COLUMN variant_id SET NOT NULL;
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'cart_items.variant_id: no se pudo marcar NOT NULL. Ejecuta PARTE 3 (backfill variantes).';
END $$;

ALTER TABLE public.cart_items
  DROP COLUMN IF EXISTS selected_dimension,
  DROP COLUMN IF EXISTS selected_thickness;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'cart_items_variant_id_fkey'
      AND conrelid = 'public.cart_items'::regclass
  ) THEN
    ALTER TABLE public.cart_items
      ADD CONSTRAINT cart_items_variant_id_fkey
      FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'cart_items_cart_id_variant_id_key'
      AND conrelid = 'public.cart_items'::regclass
  ) THEN
    ALTER TABLE public.cart_items
      ADD CONSTRAINT cart_items_cart_id_variant_id_key UNIQUE (cart_id, variant_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON public.cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON public.cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_variant_id ON public.cart_items(variant_id);

COMMIT;

-- =============================================================================
-- PARTE 3 — Backfill variantes (solo si products tenía inventario en producto padre)
-- Ejecutar si PARTE 2 falló en cart_items.variant_id NOT NULL o no hay variantes.
-- =============================================================================

/*
INSERT INTO public.product_variants (
  product_id, sku, price, compare_at_price, images, is_active
)
SELECT
  p.id,
  'default-' || LEFT(p.id::text, 8),
  p.price,
  p.compare_at_price,
  p.images,
  p.is_active
FROM public.products p
WHERE NOT EXISTS (
  SELECT 1 FROM public.product_variants pv WHERE pv.product_id = p.id
);

-- Luego re-ejecutar el bloque cart_items de PARTE 2.
*/

-- =============================================================================
-- PARTE 4 — Verificación final (debe devolver 0 filas MISSING / EXTRA legacy)
-- =============================================================================

-- Re-ejecuta solo el primer SELECT de la PARTE 1 y confirma:
--   drift_type = 'MISSING_IN_DB'  → 0 filas
--   drift_type = 'EXTRA_IN_DB (legacy)'  → 0 filas
