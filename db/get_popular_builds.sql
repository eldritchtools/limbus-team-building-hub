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
    p.title,
    p.score,
    p.deployment_order,
    p.active_sinners,
    p.like_count,
    p.comment_count,
    p.created_at,
    p.identity_ids,
    p.ego_ids,
    p.keyword_ids,
    p.tags
  FROM popular_builds_cache p
  JOIN users u ON p.user_id = u.id
  WHERE p.ranking_type = 'recent'
  ORDER BY p.score DESC
  OFFSET offset_count
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
