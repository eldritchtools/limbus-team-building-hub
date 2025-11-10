CREATE OR REPLACE FUNCTION create_build_with_tags(
  p_user_id uuid,
  p_title TEXT,
  p_body TEXT,
  p_identity_ids INT[],
  p_ego_ids INT[],
  p_keyword_ids INT[],
  p_deployment_order INT[],
  p_active_sinners INT,
  p_team_code TEXT,
  p_tags TEXT[],
  p_published BOOLEAN
)
RETURNS uuid
AS $$
DECLARE
  new_build_id uuid;
  tag_name TEXT;
  tag_id INT;
BEGIN
  INSERT INTO builds (user_id, title, body, identity_ids, ego_ids, keyword_ids, deployment_order, active_sinners, team_code, is_published)
  VALUES (p_user_id, p_title, p_body, p_identity_ids, p_ego_ids, p_keyword_ids, p_deployment_order, p_active_sinners, p_team_code, p_published)
  RETURNING id INTO new_build_id;

  FOREACH tag_name IN ARRAY p_tags LOOP
    INSERT INTO public.tags (name)
    VALUES (tag_name)
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO tag_id;

    INSERT INTO public.build_tags (build_id, tag_id)
    VALUES (new_build_id, tag_id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN new_build_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
