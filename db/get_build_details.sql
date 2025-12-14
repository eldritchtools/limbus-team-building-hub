CREATE OR REPLACE FUNCTION public.get_build_details(
  p_build_id UUID,
  p_for_edit BOOLEAN DEFAULT FALSE
)
RETURNS JSONB AS $$
DECLARE
  build_data JSONB;
  owner_id UUID;
BEGIN
  IF p_for_edit THEN
    SELECT user_id INTO owner_id FROM public.builds WHERE id = p_build_id;
    IF owner_id IS NULL THEN
      RAISE EXCEPTION 'Build not found';
    END IF;

    IF owner_id != auth.uid() THEN
      RAISE EXCEPTION 'Unauthorized to edit this build';
    END IF;
  END IF;

  IF p_for_edit THEN
    SELECT jsonb_build_object(
      'id', b.id,
      'username', u.username,
      'title', b.title,
      'body', b.body,
      'deployment_order', b.deployment_order,
      'active_sinners', b.active_sinners,
      'team_code', b.team_code,
      'youtube_video_id', b.youtube_video_id,
      'identity_ids', b.identity_ids,
      'ego_ids', b.ego_ids,
      'keyword_ids', b.keyword_ids,
      'tags', COALESCE(jsonb_agg(DISTINCT t.name) FILTER (WHERE t.id IS NOT NULL), '[]'::JSONB),
      'is_published', b.is_published
    )
    INTO build_data
    FROM public.builds b
    LEFT JOIN public.users u ON b.user_id = u.id
    LEFT JOIN public.build_tags bt ON b.id = bt.build_id
    LEFT JOIN public.tags t ON bt.tag_id = t.id
    WHERE b.id = p_build_id
    GROUP BY b.id, u.username;

  ELSE
    SELECT jsonb_build_object(
      'id', b.id,
      'user_id', u.id,
      'username', u.username,
      'title', b.title,
      'body', b.body,
      'deployment_order', b.deployment_order,
      'active_sinners', b.active_sinners,
      'team_code', b.team_code,
      'youtube_video_id', b.youtube_video_id,
      'identity_ids', b.identity_ids,
      'ego_ids', b.ego_ids,
      'keyword_ids', b.keyword_ids,
      'tags', COALESCE(jsonb_agg(DISTINCT jsonb_build_object(
        'id', t.id,
        'name', t.name
      )) FILTER (WHERE t.id IS NOT NULL), '[]'::JSONB),
      'like_count', b.like_count,
      'comment_count', b.comment_count,
      'created_at', b.created_at,
      'updated_at', b.updated_at,
      'is_published', b.is_published,
      'pinned_comment', CASE
        WHEN pc.id IS NULL THEN NULL
        ELSE jsonb_build_object(
          'id', pc.id,
          'user_id', pc.user_id,
          'username', pu.username,
          'body', pc.body,
          'created_at', pc.created_at,
          'edited', pc.edited,
          'parent_body', pp.body,
          'parent_author', ppu.username,
          'parent_deleted', pp.deleted
        )
        END
    )
    INTO build_data
    FROM public.builds b
    LEFT JOIN public.users u ON b.user_id = u.id
    LEFT JOIN public.build_tags bt ON b.id = bt.build_id
    LEFT JOIN public.tags t ON bt.tag_id = t.id
    LEFT JOIN public.comments pc ON b.pinned_comment_id = pc.id AND NOT pc.deleted
    LEFT JOIN public.users pu ON pu.id = pc.user_id
    LEFT JOIN public.comments pp ON pp.id = pc.parent_id
    LEFT JOIN public.users ppu ON ppu.id = pp.user_id
    WHERE b.id = p_build_id
    GROUP BY b.id, u.id, u.username, pc.id, pu.username, pp.body, ppu.username, pp.deleted;
  END IF;

  RETURN build_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
