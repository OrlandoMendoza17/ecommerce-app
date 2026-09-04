-- @type standalone
-- @entity reviews
-- Recalcula total_reviews y average_rating en product_stats para un producto dado.
-- Llamada desde el servidor (SECURITY DEFINER) tras insert/update/delete en reviews.

CREATE OR REPLACE FUNCTION public.recalculate_product_review_stats(
  p_product_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_avg   DECIMAL(3,2);
BEGIN
  SELECT
    COUNT(*),
    COALESCE(ROUND(AVG(rating)::numeric, 2), 0)
  INTO v_count, v_avg
  FROM public.reviews
  WHERE product_id = p_product_id
    AND is_approved = TRUE;

  INSERT INTO public.product_stats
    (product_id, total_reviews, average_rating, updated_at)
  VALUES
    (p_product_id, v_count, v_avg, NOW())
  ON CONFLICT (product_id) DO UPDATE
    SET total_reviews  = EXCLUDED.total_reviews,
        average_rating = EXCLUDED.average_rating,
        updated_at     = NOW();
END;
$$;

COMMENT ON FUNCTION public.recalculate_product_review_stats(UUID) IS
  'Recalcula total_reviews y average_rating en product_stats a partir de las reseñas aprobadas del producto.';
