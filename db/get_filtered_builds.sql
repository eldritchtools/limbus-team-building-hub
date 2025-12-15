CREATE OR REPLACE FUNCTION public.get_filtered_builds_v2(
  title_filter TEXT DEFAULT NULL,
  username_filter TEXT DEFAULT NULL,
  username_exact_filter TEXT DEFAULT NULL,
  user_id_filter UUID DEFAULT NULL,
  build_id_filter UUID DEFAULT NULL,
  tag_filter TEXT[] DEFAULT NULL,
  identity_filter INT[] DEFAULT NULL,
  ego_filter INT[] DEFAULT NULL,
  keyword_filter INT[] DEFAULT NULL,
  p_published BOOLEAN DEFAULT TRUE,
  sort_by TEXT DEFAULT 'score',
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0,
  strict_filter BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  created_at TIMESTAMPTZ,
  like_count INTEGER,
  comment_count INTEGER,
  deployment_order INTEGER[],
  active_sinners INTEGER,
  score NUMERIC,
  is_published BOOLEAN,
  username TEXT,
  tags TEXT[],
  extra_opts TEXT,
  identity_ids INT[],
  keyword_ids INT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.title,
    b.created_at,
    b.like_count,
    b.comment_count,
    b.deployment_order,
    b.active_sinners,
    b.score,
    b.is_published,
    u.username,
    ARRAY_AGG(DISTINCT t.name) AS tags,
    b.extra_opts,
    b.identity_ids,
    b.keyword_ids
  FROM public.builds AS b
  JOIN public.users AS u ON b.user_id = u.id
  LEFT JOIN public.build_tags AS bt ON b.id = bt.build_id
  LEFT JOIN public.tags AS t ON bt.tag_id = t.id
  WHERE
    (title_filter IS NULL OR b.title ILIKE '%' || title_filter || '%')
    AND (username_filter IS NULL OR u.username ILIKE '%' || username_filter || '%')
    AND (username_exact_filter IS NULL OR u.username = username_exact_filter)
    AND (user_id_filter IS NULL OR b.user_id = user_id_filter)
    AND (build_id_filter IS NULL OR b.id = build_id_filter)
    AND b.is_published = p_published
    AND (
      tag_filter IS NULL
      OR (
        (strict_filter = FALSE AND EXISTS (
            SELECT 1 FROM public.build_tags AS bt2
            JOIN public.tags AS t2 ON bt2.tag_id = t2.id
            WHERE bt2.build_id = b.id AND t2.name = ANY(tag_filter)
        ))
        OR
        (strict_filter = TRUE AND (
            SELECT COUNT(*) 
            FROM public.build_tags AS bt2
            JOIN public.tags AS t2 ON bt2.tag_id = t2.id
            WHERE bt2.build_id = b.id AND t2.name = ANY(tag_filter)
        ) = array_length(tag_filter, 1))
      )
    )
    AND (
      identity_filter IS NULL
      OR (
        (strict_filter = FALSE AND b.identity_ids && identity_filter)
        OR (strict_filter = TRUE AND b.identity_ids @> identity_filter)
      )
    )
    AND (
      ego_filter IS NULL
      OR (
        (strict_filter = FALSE AND b.ego_ids && ego_filter)
        OR (strict_filter = TRUE AND b.ego_ids @> ego_filter)
      )
    )
    AND (
      keyword_filter IS NULL
      OR (
        (strict_filter = FALSE AND b.keyword_ids && keyword_filter)
        OR (strict_filter = TRUE AND b.keyword_ids @> keyword_filter)
      )
    )
  GROUP BY 
    b.id, u.username
  ORDER BY
    CASE 
      WHEN sort_by = 'recency' THEN EXTRACT(EPOCH FROM b.created_at)
      WHEN sort_by = 'likes' THEN b.like_count
      WHEN sort_by = 'comments' THEN b.comment_count
      WHEN sort_by = 'random' THEN RANDOM()
      ELSE b.score
    END DESC
  LIMIT limit_count OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
