CREATE OR REPLACE FUNCTION public.refresh_popular_builds_cache()
RETURNS void AS $$
BEGIN
  -- Wipe old entries for this ranking type (optional)
  DELETE FROM public.popular_builds_cache WHERE ranking_type = 'recent';

  -- Insert top builds
  INSERT INTO public.popular_builds_cache (
    build_id, username, title, score, like_count, comment_count,
    created_at, identity_ids, ego_ids, keyword_ids, tags, ranking_type, computed_at
  )
  SELECT
    b.id,
    u.username,
    b.title,
    b.score,
    b.like_count,
    b.comment_count,
    b.created_at,
    b.identity_ids,
    b.ego_ids,
    b.keyword_ids,
    COALESCE((
      SELECT array_agg(t.name ORDER BY t.name)
      FROM public.build_tags bt
      JOIN public.tags t ON bt.tag_id = t.id
      WHERE bt.build_id = b.id
    ), ARRAY[]::text[]) AS tags,
    'recent' AS ranking_type,
    NOW() AS computed_at
  FROM public.builds b
  JOIN public.users u ON b.user_id = u.id
  WHERE b.is_published
  ORDER BY b.score DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;