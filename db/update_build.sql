CREATE OR REPLACE FUNCTION update_build_with_tags_v2(
  p_build_id UUID,
  p_user_id UUID,
  p_title TEXT,
  p_body TEXT,
  p_identity_ids INT[],
  p_ego_ids INT[],
  p_keyword_ids INT[],
  p_deployment_order INT[],
  p_active_sinners INT,
  p_team_code TEXT,
  p_youtube_video_id TEXT,
  p_tags TEXT[],
  p_extra_opts TEXT,
  p_published BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tag_name TEXT;
  _tag_id INT;
  _tag_ids INT[];
  owner_id UUID;
  was_published BOOLEAN;
BEGIN
  -- verify ownership
  SELECT user_id INTO owner_id FROM public.builds WHERE id = p_build_id;
  IF owner_id IS NULL THEN
    RAISE EXCEPTION 'Build not found';
  END IF;
  IF owner_id != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized to edit this build';
  END IF;

  SELECT is_published
  INTO was_published
  FROM public.builds
  WHERE id = p_build_id;

  -- update build core fields
  UPDATE public.builds
  SET
    title = p_title,
    body = p_body,
    identity_ids = p_identity_ids,
    ego_ids = p_ego_ids,
    keyword_ids = p_keyword_ids,
    deployment_order = p_deployment_order,
    active_sinners = p_active_sinners,
    team_code = p_team_code,
    youtube_video_id = p_youtube_video_id,
    extra_opts = p_extra_opts,
    is_published = p_published,
    published_at = CASE
      WHEN was_published = FALSE AND p_published = TRUE AND published_at IS NULL
      THEN NOW()
      ELSE published_at
    END,
    updated_at = NOW()
  WHERE id = p_build_id;

  -- ensure tags exist and collect their IDs
  _tag_ids := ARRAY[]::INT[];
  FOREACH tag_name IN ARRAY p_tags LOOP
    INSERT INTO public.tags (name)
    VALUES (tag_name)
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO _tag_id;

    _tag_ids := array_append(_tag_ids, _tag_id);
  END LOOP;

    DELETE FROM public.build_tags
    WHERE build_id = p_build_id
    AND build_tags.tag_id NOT IN (SELECT unnest(_tag_ids));

    INSERT INTO public.build_tags (build_id, tag_id)
    SELECT p_build_id, unnest(_tag_ids)
    ON CONFLICT DO NOTHING;
END;
$$;
