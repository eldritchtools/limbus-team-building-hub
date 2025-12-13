CREATE OR REPLACE FUNCTION public.get_popular_builds(limit_count INTEGER, offset_count INTEGER)
RETURNS TABLE (
  build_id UUID,
  username TEXT,
  title TEXT,
  score NUMERIC,
  deployment_order INTEGER[],
  active_sinners INTEGER,
  like_count INTEGER,
  comment_count INTEGER,
  created_at TIMESTAMPTZ,
  identity_ids INTEGER[],
  ego_ids INTEGER[],
  keyword_ids INTEGER[],
  tags TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.build_id,
    u.username,
    b.title,
    b.score,
    b.deployment_order,
    b.active_sinners,
    b.like_count,
    b.comment_count,
    b.created_at,
    b.identity_ids,
    b.ego_ids,
    b.keyword_ids,
    COALESCE((
      SELECT array_agg(t.name)
      FROM public.build_tags bt
      JOIN public.tags t ON bt.tag_id = t.id
      WHERE bt.build_id = b.id
    ), ARRAY[]::text[]) AS tags
  FROM popular_builds_cache p
  JOIN builds b ON p.build_id = b.id
  JOIN users u ON b.user_id = u.id
  WHERE p.ranking_type = 'recent'
  ORDER BY p.score DESC
  OFFSET offset_count
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
