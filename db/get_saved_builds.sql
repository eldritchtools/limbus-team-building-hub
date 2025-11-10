CREATE OR REPLACE FUNCTION public.get_saved_builds(
  p_user_id UUID,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  created_at TIMESTAMPTZ,
  like_count INTEGER,
  comment_count INTEGER,
  username TEXT,
  tags TEXT[],
  identity_ids INT[],
  keyword_ids INT[],
  saved_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.title,
    b.created_at,
    b.like_count,
    b.comment_count,
    u.username,
    ARRAY_AGG(DISTINCT t.name) AS tags,
    b.identity_ids,
    b.keyword_ids,
    s.created_at
  FROM public.saves AS s
  LEFT JOIN public.builds AS b ON b.id = s.build_id
  LEFT JOIN public.users u ON b.user_id = u.id
  LEFT JOIN public.build_tags bt ON b.id = bt.build_id
  LEFT JOIN public.tags t ON bt.tag_id = t.id
  WHERE s.user_id = p_user_id
  GROUP BY b.id, u.username, s.created_at
  ORDER BY s.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
