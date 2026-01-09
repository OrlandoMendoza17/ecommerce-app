-- ============================================
-- MIGRACIÓN: Añadir sistema de opciones configurables
-- ============================================
-- Este script añade los campos necesarios para el sistema
-- de opciones de productos (dimension_options, thickness_options)
-- 
-- SOLO ejecutar si ya tienes las tablas creadas.
-- Si es nueva instalación, usa los archivos en tables/
-- ============================================

-- 1. Actualizar tabla PRODUCTS
-- ============================================

-- Verificar si los campos ya existen
DO $$ 
BEGIN
    -- Añadir dimension_options si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'dimension_options'
    ) THEN
        ALTER TABLE public.products 
        ADD COLUMN dimension_options TEXT[] DEFAULT '{}';
        
        RAISE NOTICE '✅ Campo dimension_options añadido a products';
    ELSE
        RAISE NOTICE '⚠️  Campo dimension_options ya existe en products';
    END IF;
    
    -- Añadir thickness_options si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'thickness_options'
    ) THEN
        ALTER TABLE public.products 
        ADD COLUMN thickness_options TEXT[] DEFAULT '{}';
        
        RAISE NOTICE '✅ Campo thickness_options añadido a products';
    ELSE
        RAISE NOTICE '⚠️  Campo thickness_options ya existe en products';
    END IF;
    
    -- Eliminar campos antiguos si existen
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'thickness_mm'
    ) THEN
        ALTER TABLE public.products 
        DROP COLUMN thickness_mm;
        
        RAISE NOTICE '✅ Campo thickness_mm eliminado de products';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'dimensions_cm'
    ) THEN
        ALTER TABLE public.products 
        DROP COLUMN dimensions_cm;
        
        RAISE NOTICE '✅ Campo dimensions_cm eliminado de products';
    END IF;
END $$;

-- 2. Actualizar tabla CART_ITEMS
-- ============================================

DO $$ 
BEGIN
    -- Añadir selected_dimension si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'cart_items' 
        AND column_name = 'selected_dimension'
    ) THEN
        ALTER TABLE public.cart_items 
        ADD COLUMN selected_dimension TEXT DEFAULT '';
        
        RAISE NOTICE '✅ Campo selected_dimension añadido a cart_items';
    ELSE
        RAISE NOTICE '⚠️  Campo selected_dimension ya existe en cart_items';
    END IF;
    
    -- Añadir selected_thickness si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'cart_items' 
        AND column_name = 'selected_thickness'
    ) THEN
        ALTER TABLE public.cart_items 
        ADD COLUMN selected_thickness TEXT DEFAULT '';
        
        RAISE NOTICE '✅ Campo selected_thickness añadido a cart_items';
    ELSE
        RAISE NOTICE '⚠️  Campo selected_thickness ya existe en cart_items';
    END IF;
END $$;

-- 3. Actualizar UNIQUE constraint en CART_ITEMS
-- ============================================

-- Primero eliminar el constraint antiguo si existe
DO $$ 
BEGIN
    -- Buscar el nombre del constraint único actual
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_schema = 'public'
        AND table_name = 'cart_items'
        AND constraint_type = 'UNIQUE'
        AND constraint_name LIKE '%cart_id%product_id%'
    ) THEN
        -- Obtener el nombre exacto del constraint
        DECLARE
            constraint_name_var TEXT;
        BEGIN
            SELECT constraint_name INTO constraint_name_var
            FROM information_schema.table_constraints 
            WHERE table_schema = 'public'
            AND table_name = 'cart_items'
            AND constraint_type = 'UNIQUE'
            AND constraint_name LIKE '%cart_id%product_id%'
            LIMIT 1;
            
            EXECUTE format('ALTER TABLE public.cart_items DROP CONSTRAINT %I', constraint_name_var);
            
            RAISE NOTICE '✅ Constraint único antiguo eliminado: %', constraint_name_var;
        END;
    END IF;
    
    -- Crear el nuevo constraint que incluye las opciones
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_schema = 'public'
        AND table_name = 'cart_items'
        AND constraint_name = 'cart_items_cart_id_product_id_options_key'
    ) THEN
        ALTER TABLE public.cart_items 
        ADD CONSTRAINT cart_items_cart_id_product_id_options_key 
        UNIQUE (cart_id, product_id, selected_dimension, selected_thickness);
        
        RAISE NOTICE '✅ Nuevo constraint único creado (incluye opciones)';
    ELSE
        RAISE NOTICE '⚠️  Constraint único con opciones ya existe';
    END IF;
END $$;

-- 4. Actualizar tabla ORDER_ITEMS
-- ============================================

DO $$ 
BEGIN
    -- Añadir selected_dimension si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'order_items' 
        AND column_name = 'selected_dimension'
    ) THEN
        ALTER TABLE public.order_items 
        ADD COLUMN selected_dimension TEXT DEFAULT '';
        
        RAISE NOTICE '✅ Campo selected_dimension añadido a order_items';
    ELSE
        RAISE NOTICE '⚠️  Campo selected_dimension ya existe en order_items';
    END IF;
    
    -- Añadir selected_thickness si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'order_items' 
        AND column_name = 'selected_thickness'
    ) THEN
        ALTER TABLE public.order_items 
        ADD COLUMN selected_thickness TEXT DEFAULT '';
        
        RAISE NOTICE '✅ Campo selected_thickness añadido a order_items';
    ELSE
        RAISE NOTICE '⚠️  Campo selected_thickness ya existe en order_items';
    END IF;
END $$;

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════';
    RAISE NOTICE '✅ MIGRACIÓN COMPLETADA';
    RAISE NOTICE '═══════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE 'Campos añadidos/actualizados:';
    RAISE NOTICE '  ✓ products.dimension_options (TEXT[])';
    RAISE NOTICE '  ✓ products.thickness_options (TEXT[])';
    RAISE NOTICE '  ✓ cart_items.selected_dimension (TEXT)';
    RAISE NOTICE '  ✓ cart_items.selected_thickness (TEXT)';
    RAISE NOTICE '  ✓ order_items.selected_dimension (TEXT)';
    RAISE NOTICE '  ✓ order_items.selected_thickness (TEXT)';
    RAISE NOTICE '';
    RAISE NOTICE 'Constraints actualizados:';
    RAISE NOTICE '  ✓ cart_items UNIQUE incluye opciones';
    RAISE NOTICE '';
    RAISE NOTICE '📚 Lee la guía completa:';
    RAISE NOTICE '   docs/product_options_guide.md';
    RAISE NOTICE '';
END $$;

