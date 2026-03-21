CREATE OR REPLACE FUNCTION public.search_builds_v9(
  p_query TEXT DEFAULT NULL,
  build_id_filter UUID[] DEFAULT NULL,
  username_exact_filter TEXT DEFAULT NULL,
  user_id_filter UUID DEFAULT NULL,
  tag_filter TEXT[] DEFAULT NULL,
  identity_filter INT[] DEFAULT NULL,
  identity_exclude INT[] DEFAULT NULL,
  ego_filter INT[] DEFAULT NULL,
  ego_exclude INT[] DEFAULT NULL,
  keyword_filter INT[] DEFAULT NULL,
  keyword_exclude INT[] DEFAULT NULL,
  p_sort_by TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_published BOOLEAN DEFAULT TRUE,
  p_strict_filter BOOLEAN DEFAULT FALSE,
  p_ignore_block_discovery BOOLEAN DEFAULT FALSE,
  p_include_egos BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  like_count INTEGER,
  comment_count INTEGER,
  deployment_order INTEGER[],
  active_sinners INTEGER,
  score NUMERIC,
  is_published BOOLEAN,
  username TEXT,
  user_flair TEXT,
  tags TEXT[],
  extra_opts TEXT,
  identity_ids INT[],
  keyword_ids INT[],
  ego_ids INT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sort TEXT;
  v_tsquery tsquery;
BEGIN

  -- Determine sort mode
  IF p_sort_by IS NOT NULL THEN
    v_sort := p_sort_by;
  ELSIF p_query IS NOT NULL THEN
    v_sort := 'search';
  ELSE
    v_sort := 'new';
  END IF;

  -- Build tsquery
  IF p_query IS NOT NULL THEN
    v_tsquery := plainto_tsquery('english', p_query);
  END IF;

  RETURN QUERY

  WITH builds AS (
    SELECT
      b.id,
      b.title,
      b.created_at,
      b.updated_at,
      b.published_at,
      b.like_count,
      b.comment_count,
      b.deployment_order,
      b.active_sinners,
      b.score,
      b.is_published,
      u.username,
      u.flair,
      b.extra_opts,
      b.identity_ids,
      b.keyword_ids,
      CASE WHEN p_include_egos THEN b.ego_ids ELSE NULL END AS ego_ids,
      b.search_vector,

      CASE
        WHEN v_sort = 'search' AND v_tsquery IS NOT NULL THEN ts_rank(b.search_vector, v_tsquery)
        WHEN v_sort = 'new' THEN EXTRACT(EPOCH FROM COALESCE(b.published_at, b.created_at))
        WHEN v_sort = 'popular' THEN b.score
        WHEN v_sort = 'random' THEN RANDOM()
      END AS sort_value

    FROM public.builds b
    JOIN public.users u ON b.user_id = u.id

    WHERE
      b.is_published = p_published
      AND (build_id_filter IS NULL OR b.id = ANY(build_id_filter))
      AND (username_exact_filter IS NULL OR u.username = username_exact_filter)
      AND (user_id_filter IS NULL OR b.user_id = user_id_filter)
      AND (v_tsquery IS NULL OR b.search_vector @@ v_tsquery)
      AND (p_ignore_block_discovery = TRUE OR b.block_discovery = FALSE)

      -- tag filter
      AND (
        tag_filter IS NULL OR EXISTS (
          SELECT 1
          FROM public.build_tags bt2
          JOIN public.tags t2 ON bt2.tag_id = t2.id
          WHERE bt2.build_id = b.id
          AND t2.name = ANY(tag_filter)
        )
      )

      -- identity filters
      AND (
        identity_filter IS NULL
        OR (
          (p_strict_filter = FALSE AND b.identity_ids && identity_filter)
          OR (p_strict_filter = TRUE AND b.identity_ids @> identity_filter)
        )
      )
      AND (
        identity_exclude IS NULL
        OR NOT (b.identity_ids && identity_exclude)
      )

      -- ego filters
      AND (
        ego_filter IS NULL
        OR (
          (p_strict_filter = FALSE AND b.ego_ids && ego_filter)
          OR (p_strict_filter = TRUE AND b.ego_ids @> ego_filter)
        )
      )
      AND (
        ego_exclude IS NULL
        OR NOT (b.ego_ids && ego_exclude)
      )

      -- keyword filters
      AND (
        keyword_filter IS NULL
        OR (
          (p_strict_filter = FALSE AND b.keyword_ids && keyword_filter)
          OR (p_strict_filter = TRUE AND b.keyword_ids @> keyword_filter)
        )
      )
      AND (
        keyword_exclude IS NULL
        OR NOT (b.keyword_ids && keyword_exclude)
      )

    ORDER BY sort_value DESC
    LIMIT p_limit OFFSET p_offset
  ),

  build_tags AS (
    SELECT
      bt.build_id,
      ARRAY_AGG(DISTINCT t.name) AS tags
    FROM public.build_tags bt
    JOIN public.tags t ON t.id = bt.tag_id
    GROUP BY bt.build_id
  )

  SELECT
    b.id,
    b.title,
    b.created_at,
    b.updated_at,
    b.published_at,
    b.like_count,
    b.comment_count,
    b.deployment_order,
    b.active_sinners,
    b.score,
    b.is_published,
    b.username,
    b.flair AS user_flair,
    COALESCE(bt.tags, ARRAY[]::TEXT[]) AS tags,
    b.extra_opts,
    b.identity_ids,
    b.keyword_ids,
    b.ego_ids

  FROM builds b
  LEFT JOIN build_tags bt ON bt.build_id = b.id

  ORDER BY b.sort_value DESC;

END;
$$;