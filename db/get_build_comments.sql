CREATE OR REPLACE FUNCTION public.get_build_comments_v2(
  p_build_id UUID,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  username TEXT,
  user_flair TEXT,
  body TEXT,
  created_at TIMESTAMPTZ,
  edited BOOLEAN,
  parent_body TEXT,
  parent_author TEXT,
  parent_flair TEXT,
  parent_deleted BOOLEAN
)
LANGUAGE sql
SECURITY INVOKER
AS $$
  SELECT
    c.id,
    c.user_id,
    u.username,
    u.flair,
    c.body,
    c.created_at,
    c.edited,
    p.body AS parent_body,
    pu.username AS parent_author,
    pu.flair AS parent_flair,
    p.deleted AS parent_deleted
  FROM public.comments AS c
  JOIN public.users AS u ON c.user_id = u.id
  LEFT JOIN public.comments AS p ON p.id = c.parent_id
  LEFT JOIN public.users AS pu ON pu.id = p.user_id
  WHERE c.build_id = p_build_id
    AND NOT c.deleted
  ORDER BY c.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;
