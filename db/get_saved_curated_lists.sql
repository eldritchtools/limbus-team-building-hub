CREATE OR REPLACE FUNCTION public.get_saved_build_lists(
  p_user_id UUID,
  p_sort_by text DEFAULT NULL,
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  username TEXT,
  user_flair TEXT,
  title text,
  short_desc text,
  created_at timestamptz,
  published_at timestamptz,
  tags TEXT[],
  like_count INT,
  comment_count INT,
  items jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  saved_ids UUID[];
BEGIN
  -- get all saved curated list IDs for the user
  SELECT COALESCE(ARRAY_AGG(target_id), ARRAY[]::UUID[])
  INTO saved_ids
  FROM public.saves
  WHERE user_id = p_user_id
    AND target_type = 'build_list';

  IF saved_ids = '{}' THEN
    RETURN;
  END IF;

  -- call search_build_lists with the filter
  RETURN QUERY
    SELECT *
    FROM public.search_build_lists_v2(
      p_query := NULL,
      list_id_filter := saved_ids,
      username_exact_filter := NULL,
      user_id_filter := NULL,
      tag_filter := NULL,
      p_sort_by := p_sort_by,
      p_limit := p_limit,
      p_offset := p_offset,
      p_published := TRUE,
      p_ignore_block_discovery := TRUE
    );
END;
$$;