CREATE OR REPLACE FUNCTION public.refresh_popular_builds_cache()
RETURNS void AS $$
BEGIN
  -- Wipe old entries for this ranking type (optional)
  DELETE FROM public.popular_builds_cache WHERE ranking_type = 'recent';

  -- Insert top builds
  INSERT INTO public.popular_builds_cache (
    build_id, score, ranking_type, computed_at
  )
  SELECT
    b.id,
    b.score,
    'recent' AS ranking_type,
    NOW() AS computed_at
  FROM public.builds b
  WHERE b.is_published
  ORDER BY b.score DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;