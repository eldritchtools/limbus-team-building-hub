create table public.build_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  short_desc TEXT,

  is_published BOOLEAN DEFAULT TRUE,

  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  score NUMERIC DEFAULT 0,
  search_vector tsvector,
  view_count INTEGER NOT NULL DEFAULT 0,
  block_discovery BOOLEAN NOT NULL DEFAULT FALSE,
  submission_mode build_list_submission_mode DEFAULT 'closed',
  pinned_comment_id UUID REFERENCES public.comments(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ DEFAULT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

create index build_lists_user_id_idx on public.build_lists(user_id);
create index build_lists_created_at_idx on public.build_lists(created_at desc);
create index build_lists_published_idx on public.build_lists(is_published, created_at desc);
create index build_lists_user_created_idx on public.build_lists(user_id, created_at desc);
create index build_lists_search_idx on public.build_lists using gin (search_vector);

create table public.build_list_items (
  list_id UUID REFERENCES public.build_lists(id) ON DELETE CASCADE,
  build_id UUID REFERENCES public.builds(id) ON DELETE CASCADE,

  note TEXT,
  position INTEGER NOT NULL,
  
  submitted_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (list_id, build_id),
  UNIQUE (list_id, position)
);

create index build_list_items_list_id_idx on public.build_list_items(list_id);
create index build_list_items_build_id_idx on public.build_list_items(build_id);
CREATE INDEX build_list_items_list_position_idx ON public.build_list_items (list_id, position);

alter table public.build_lists enable row level security;
alter table public.build_list_items enable row level security;

create policy "Public build lists are viewable"
on public.build_lists
for select
using (true);

create policy "Users can view own lists"
on public.build_lists
for select
using (auth.uid() = user_id);

create policy "Users can create lists"
on public.build_lists
for insert
with check (auth.uid() = user_id);

create policy "Users can update own lists"
on public.build_lists
for update
using (auth.uid() = user_id);

create policy "Users can delete own lists"
on public.build_lists
for delete
using (auth.uid() = user_id);

create policy "List items follow list visibility"
on public.build_list_items
for select
using (
  exists (
    select 1 from public.build_lists
    where build_lists.id = build_list_items.list_id
    and (
      build_lists.is_published = true
      or build_lists.user_id = auth.uid()
    )
  )
);

create policy "Users manage own list items"
on public.build_list_items
for all
using (
  exists (
    select 1 from public.build_lists
    where build_lists.id = build_list_items.list_id
    and build_lists.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.build_lists
    where build_lists.id = build_list_items.list_id
    and build_lists.user_id = auth.uid()
  )
);

create or replace function public.search_build_lists_v3(
  p_query text default null,
  list_id_filter UUID[] DEFAULT NULL,
  username_exact_filter TEXT DEFAULT NULL,
  user_id_filter UUID DEFAULT NULL,
  tag_filter TEXT[] DEFAULT NULL,
  p_sort_by text default null,
  p_limit int default 20,
  p_offset int default 0,
  p_published BOOLEAN DEFAULT TRUE,
  p_ignore_block_discovery boolean default false
)
returns table (
  id uuid,
  user_id uuid,
  username TEXT,
  user_flair TEXT,
  title text,
  short_desc text,
  submission_mode build_list_submission_mode,
  created_at timestamptz,
  published_at timestamptz,
  tags TEXT[],
  like_count INT,
  comment_count INT,
  items jsonb
)
language plpgsql
security definer
as $$
declare
  v_sort text;
  v_tsquery tsquery;
begin

  -- Determine effective sort mode
  if p_sort_by is not null then
    v_sort := p_sort_by;
  elsif p_query is not null then
    v_sort := 'search';
  else
    v_sort := 'new';
  end if;

  if p_query is not null then
    v_tsquery := plainto_tsquery('english', p_query);
  end if;

  return query

  WITH lists AS (
    SELECT
      bl.id,
      bl.user_id,
      u.username,
      u.flair,
      bl.title,
      bl.short_desc,
      bl.submission_mode,
      bl.created_at,
      bl.published_at,
      bl.search_vector,
      bl.like_count,
      bl.comment_count,
      CASE
        WHEN v_sort = 'search' AND v_tsquery IS NOT NULL THEN ts_rank(bl.search_vector, v_tsquery)
        WHEN v_sort = 'new' THEN EXTRACT(EPOCH FROM COALESCE(bl.published_at, bl.created_at))
        WHEN v_sort = 'popular' THEN bl.score
        WHEN v_sort = 'random' THEN RANDOM()
      END AS sort_value 
    FROM public.build_lists bl
    JOIN public.users u ON bl.user_id = u.id
    WHERE bl.is_published = p_published
      AND (list_id_filter IS NULL OR bl.id = ANY(list_id_filter))
      AND (username_exact_filter IS NULL OR u.username = username_exact_filter)
      AND (user_id_filter IS NULL OR bl.user_id = user_id_filter)
      AND (v_tsquery IS NULL OR bl.search_vector @@ v_tsquery)
      AND (p_ignore_block_discovery = TRUE OR bl.block_discovery = FALSE)
      AND (
        tag_filter IS NULL OR EXISTS (
          SELECT 1
          FROM public.build_list_tags blt2
          JOIN public.tags t2 ON blt2.tag_id = t2.id
          WHERE blt2.list_id = bl.id
          AND t2.name = ANY(tag_filter)
        )
      )
    ORDER BY sort_value DESC
    LIMIT p_limit OFFSET p_offset
  ),

  list_builds AS (
    SELECT
      bli.list_id,
      array_agg(bli.build_id ORDER BY bli.position) AS build_ids
    FROM public.build_list_items bli
    JOIN lists l ON l.id = bli.list_id
    GROUP BY bli.list_id
  ),

  all_build_ids AS (
    SELECT DISTINCT unnest(build_ids) AS build_id
    FROM list_builds
  ),

  builds AS (
    SELECT *
    FROM public.get_filtered_builds_v7(
      build_id_filter := ARRAY(
        SELECT build_id FROM all_build_ids
      ),
      limit_count := 1000
    )
  ),

  list_tags AS (
    SELECT
      blt.list_id,
      ARRAY_AGG(DISTINCT t.name) AS tags
    FROM public.build_list_tags blt
    JOIN public.tags t ON t.id = blt.tag_id
    GROUP BY blt.list_id
  )

  SELECT
    l.id,
    l.user_id,
    l.username,
    l.flair AS user_flair,
    l.title,
    l.short_desc,
    l.submission_mode,
    l.created_at,
    l.published_at,
    COALESCE(lt.tags, ARRAY[]::TEXT[]) AS tags,
    l.like_count,
    l.comment_count,
    COALESCE(
      jsonb_agg(
        b ORDER BY array_position(lb.build_ids, b.id)
      ) FILTER (WHERE b.id IS NOT NULL),
      '[]'::jsonb
    ) AS items

  FROM lists l
  LEFT JOIN list_builds lb ON lb.list_id = l.id
  LEFT JOIN builds b ON b.id = ANY(lb.build_ids)
  LEFT JOIN list_tags lt ON lt.list_id = l.id

  GROUP BY
    l.id,
    l.user_id,
    l.username,
    l.flair,
    l.title,
    l.short_desc,
    l.submission_mode,
    l.created_at,
    l.published_at,
    lt.tags,
    lb.build_ids,
    l.sort_value,
    l.like_count,
    l.comment_count
  ORDER BY l.sort_value DESC;
end;
$$;

create or replace function public.create_build_list_v2(
  p_title text,
  p_body text,
  p_short_desc text,
  p_is_published boolean,
  p_block_discovery boolean,
  p_items jsonb,
  p_submission_mode build_list_submission_mode,
  p_tags TEXT[]
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_list_id uuid;
  v_user_id uuid := auth.uid();
  v_item jsonb;
  v_position int := 0;
  v_username text;
  tag_name TEXT;
  tag_id INT;
begin
  -- get username for search vector
  select username into v_username
  from public.users
  where id = v_user_id;

  insert into public.build_lists (
    user_id,
    title,
    body,
    short_desc,
    submission_mode,
    is_published,
    block_discovery,
    published_at,
    search_vector
  )
  values (
    v_user_id,
    p_title,
    p_body,
    p_short_desc,
    p_submission_mode,
    p_is_published,
    p_block_discovery,
    case when p_is_published then now() else null end,
    to_tsvector(
      'english',
      coalesce(p_title,'') || ' ' ||
      coalesce(p_body,'') || ' ' ||
      coalesce(v_username,'')
    )
  )
  returning id into v_list_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into public.build_list_items (
      list_id,
      build_id,
      note,
      position,
      submitted_by
    )
    values (
      v_list_id,
      (v_item->>'build_id')::uuid,
      v_item->>'note',
      v_position,
      (v_item->>'submitted_by')::uuid
    );

    v_position := v_position + 1;
  end loop;

  FOREACH tag_name IN ARRAY p_tags LOOP
    INSERT INTO public.tags (name)
    VALUES (tag_name)
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO tag_id;

    INSERT INTO public.build_list_tags (list_id, tag_id)
    VALUES (v_list_id, tag_id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  return v_list_id;
end;
$$;

create or replace function public.update_build_list_v2(
  p_list_id uuid,
  p_title text,
  p_body text,
  p_short_desc text,
  p_submission_mode build_list_submission_mode,
  p_is_published boolean,
  p_block_discovery boolean,
  p_items jsonb,
  p_tags TEXT[]
)
returns void
language plpgsql
security definer
as $$
declare
  v_user_id uuid := auth.uid();
  v_item jsonb;
  v_position int := 0;
  v_username text;
  tag_name TEXT;
  _tag_id INT;
  _tag_ids INT[];
begin
  -- verify ownership
  if not exists (
    select 1 from public.build_lists
    where id = p_list_id
      and user_id = v_user_id
  ) then
    raise exception 'Not authorized';
  end if;

  select username into v_username
  from public.users
  where id = v_user_id;

  update public.build_lists
  set title = p_title,
      body = p_body,
      short_desc = p_short_desc,
      submission_mode = p_submission_mode,
      is_published = p_is_published,
      block_discovery = p_block_discovery,
      published_at = case when p_is_published then coalesce(published_at, now()) else null end,
      updated_at = now(),
      search_vector =
        to_tsvector(
          'english',
          coalesce(p_title,'') || ' ' ||
          coalesce(p_body,'') || ' ' ||
          coalesce(v_username,'')
        )
  where id = p_list_id;

  delete from public.build_list_items
  where list_id = p_list_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into public.build_list_items (
      list_id,
      build_id,
      note,
      position,
      submitted_by
    )
    values (
      p_list_id,
      (v_item->>'build_id')::uuid,
      v_item->>'note',
      v_position,
      (v_item->>'submitted_by')::uuid
    );

    v_position := v_position + 1;
  end loop;

  -- ensure tags exist and collect their IDs
  _tag_ids := ARRAY[]::INT[];
  FOREACH tag_name IN ARRAY p_tags LOOP
    INSERT INTO public.tags (name)
    VALUES (tag_name)
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO _tag_id;

    _tag_ids := array_append(_tag_ids, _tag_id);
  END LOOP;

  DELETE FROM public.build_list_tags
  WHERE list_id = p_list_id
  AND build_list_tags.tag_id NOT IN (SELECT unnest(_tag_ids));

  INSERT INTO public.build_list_tags (list_id, tag_id)
  SELECT p_list_id, unnest(_tag_ids)
  ON CONFLICT DO NOTHING;
end;
$$;

create or replace function public.get_build_list_v3(
  p_list_id uuid
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_user_id uuid := auth.uid();
  v_result jsonb;
begin
  update public.build_lists bl
  set view_count = bl.view_count + 1
  where bl.id = p_list_id
    and bl.is_published = true
    and (v_user_id is null or bl.user_id <> v_user_id);

  WITH list_data AS (
    SELECT
      bl.id,
      bl.user_id,
      u.username,
      u.flair,
      bl.title,
      bl.body,
      bl.short_desc,
      bl.submission_mode,
      bl.is_published,
      bl.created_at,
      bl.published_at,
      bl.updated_at,
      bl.view_count,
      bl.like_count,
      bl.comment_count,
      bl.block_discovery,

      pc.id AS pinned_comment_id,
      pc.user_id AS pinned_user_id,
      pc.body AS pinned_body,
      pc.created_at AS pinned_created_at,
      pc.edited AS pinned_edited,
      pu.username AS pinned_username,
      pu.flair AS pinned_user_flair,
      pp.body AS parent_body,
      ppu.username AS parent_author,
      ppu.flair AS parent_flair,
      pp.deleted AS parent_deleted

    FROM public.build_lists bl
    JOIN public.users u ON bl.user_id = u.id
    LEFT JOIN public.comments pc ON bl.pinned_comment_id = pc.id AND NOT pc.deleted
    LEFT JOIN public.users pu ON pu.id = pc.user_id
    LEFT JOIN public.comments pp ON pp.id = pc.parent_id
    LEFT JOIN public.users ppu ON ppu.id = pp.user_id
    WHERE bl.id = p_list_id
  ),

  list_builds AS (
    SELECT
      bli.list_id,
      array_agg(bli.build_id ORDER BY bli.position) AS build_ids
    FROM public.build_list_items bli
    WHERE bli.list_id = p_list_id
    GROUP BY bli.list_id
  ),

  builds AS (
    SELECT *
    FROM public.get_filtered_builds_v7(
      build_id_filter := (
        SELECT build_ids FROM list_builds
      ),
      p_published := true,
      limit_count := 1000
    )
  ),

  list_tags AS (
    SELECT
      blt.list_id,
      jsonb_agg(
        DISTINCT jsonb_build_object(
          'id', t.id,
          'name', t.name
        )
      ) AS tags
    FROM public.build_list_tags blt
    JOIN public.tags t ON t.id = blt.tag_id
    WHERE blt.list_id = p_list_id
    GROUP BY blt.list_id
  ),

  items AS (
    SELECT
      jsonb_agg(
        jsonb_build_object(
          'build', to_jsonb(b),
          'note', bli.note,
          'submitted_by', bli.submitted_by,
          'submitted_by_username', u_submit.username,
          'submitted_by_flair', u_submit.flair
        )
        ORDER BY array_position(lb.build_ids, b.id)
      ) AS items
    FROM list_builds lb
    JOIN public.build_list_items bli
      ON bli.list_id = lb.list_id
    LEFT JOIN builds b
      ON b.id = bli.build_id
    LEFT JOIN public.users u_submit
      ON bli.submitted_by = u_submit.id
  )

  SELECT jsonb_build_object(
    'id', l.id,
    'user_id', l.user_id,
    'username', l.username,
    'user_flair', l.flair,
    'title', l.title,
    'body', l.body,
    'short_desc', l.short_desc,
    'submission_mode', l.submission_mode,
    'is_published', l.is_published,
    'created_at', l.created_at,
    'published_at', l.published_at,
    'updated_at', l.updated_at,
    'view_count',
      CASE
        WHEN l.user_id = v_user_id THEN l.view_count
        ELSE NULL
      END,
    'like_count', l.like_count,
    'comment_count', l.comment_count,
    'block_discovery', l.block_discovery,
    'tags', COALESCE(lt.tags, '[]'::jsonb),
    'items', COALESCE(i.items, '[]'::jsonb),
    'pinned_comment', CASE
      WHEN l.pinned_comment_id IS NULL THEN NULL
      ELSE jsonb_build_object(
        'id', l.pinned_comment_id,
        'user_id', l.pinned_user_id,
        'username', l.pinned_username,
        'user_flair', l.pinned_user_flair,
        'body', l.pinned_body,
        'created_at', l.pinned_created_at,
        'edited', l.pinned_edited,
        'parent_body', l.parent_body,
        'parent_author', l.parent_author,
        'parent_flair', l.parent_flair,
        'parent_deleted', l.parent_deleted
      )
    END
  )
  INTO v_result
  FROM list_data l
  LEFT JOIN list_tags lt ON lt.list_id = l.id
  LEFT JOIN items i ON TRUE;
  
  return v_result;

end;
$$;

create table public.build_list_tags (
  list_id uuid not null references public.build_lists(id) on delete cascade,
  tag_id int not null references public.tags(id) on delete cascade,

  primary key (list_id, tag_id)
);

create index build_list_tags_list_id_idx on public.build_list_tags(list_id);
create index build_list_tags_tag_id_idx on public.build_list_tags(tag_id);

alter table public.build_list_tags enable row level security;

create policy "List tags follow list ownership"
on public.build_list_tags
for all
using (
  exists (
    select 1
    from public.build_lists bl
    where bl.id = build_list_tags.list_id
    and bl.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.build_lists bl
    where bl.id = build_list_tags.list_id
    and bl.user_id = auth.uid()
  )
);

CREATE TABLE public.build_list_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  list_id uuid NOT NULL REFERENCES public.build_lists(id) ON DELETE CASCADE,
  build_id uuid NOT NULL REFERENCES public.builds(id) ON DELETE CASCADE,

  submitted_by uuid NOT NULL REFERENCES public.users(id),
  submitted_at timestamptz NOT NULL DEFAULT now(),

  note text,
  submitter_note text,

  status text NOT NULL DEFAULT 'pending',

  reviewed_by uuid REFERENCES public.users(id),
  reviewed_at timestamptz
);

CREATE UNIQUE INDEX uniq_user_submission
ON build_list_submissions(list_id, build_id, submitted_by)
WHERE status = 'pending';

CREATE INDEX idx_submission_list_status
ON build_list_submissions(list_id, status, submitted_at DESC);

CREATE TYPE build_list_submission_mode AS ENUM (
  'closed',
  'open'
);

ALTER TABLE public.build_lists
ADD COLUMN submission_mode build_list_submission_mode
DEFAULT 'closed';

ALTER TABLE public.build_list_submissions
ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can submit published builds to open lists"
ON public.build_list_submissions
FOR INSERT
TO authenticated
WITH CHECK (
  submitted_by = auth.uid()

  AND EXISTS (
    SELECT 1
    FROM public.build_lists bl
    WHERE bl.id = build_list_submissions.list_id
      AND bl.submission_mode = 'open'
  )

  AND EXISTS (
    SELECT 1
    FROM public.builds b
    WHERE b.id = build_list_submissions.build_id
      AND b.is_published = TRUE
  )
);

CREATE POLICY "users can view their own submissions"
ON public.build_list_submissions
FOR SELECT
TO authenticated
USING (
  submitted_by = auth.uid()
);

CREATE POLICY "list owners can view submissions"
ON public.build_list_submissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.build_lists bl
    WHERE bl.id = build_list_submissions.list_id
      AND bl.user_id = auth.uid()
  )
);

CREATE POLICY "list owners can update submissions"
ON public.build_list_submissions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.build_lists bl
    WHERE bl.id = build_list_submissions.list_id
      AND bl.user_id = auth.uid()
  )
);

CREATE OR REPLACE FUNCTION public.get_build_list_submissions(
  p_list_id uuid
)
RETURNS TABLE (
  submission_id uuid,
  list_id uuid,
  build_id uuid,
  note text,
  submitter_note text,
  submitted_at timestamptz,
  submitter jsonb,
  build jsonb
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    s.id AS submission_id,
    s.list_id,
    s.build_id,
    s.note,
    s.submitter_note,
    s.submitted_at,

    jsonb_build_object(
      'user_id', s.submitted_by,
      'username', su.username,
      'flair', su.flair
    ),

    jsonb_build_object(
      'id', b.id,
      'username', bu.username,
      'user_flair', bu.flair,
      'title', b.title,
      'deployment_order', b.deployment_order,
      'active_sinners', b.active_sinners,
      'identity_ids', b.identity_ids,
      'ego_ids', b.ego_ids,
      'keyword_ids', b.keyword_ids,
      'created_at', b.created_at,
      'published_at', b.published_at,
      'updated_at', b.updated_at,
      'tags',
        COALESCE(
          jsonb_agg(DISTINCT t.name) FILTER (WHERE t.id IS NOT NULL),
          '[]'::jsonb
        )
    ) AS build

  FROM public.build_list_submissions s

  JOIN public.builds b
    ON b.id = s.build_id

  LEFT JOIN public.users bu
    ON bu.id = b.user_id

  LEFT JOIN public.users su
    ON su.id = s.submitted_by

  LEFT JOIN public.build_tags bt
    ON bt.build_id = b.id

  LEFT JOIN public.tags t
    ON t.id = bt.tag_id

  WHERE s.list_id = p_list_id
    AND s.status = 'pending'

  GROUP BY
    s.id,
    s.list_id,
    s.build_id,
    s.note,
    s.submitter_note,
    s.submitted_at,
    s.submitted_by,
    su.username,
    su.flair,
    b.id,
    bu.username,
    bu.flair

  ORDER BY s.submitted_at;
$$;

CREATE INDEX idx_submissions_list_status ON build_list_submissions(list_id, status, submitted_at);

CREATE OR REPLACE FUNCTION public.approve_build_list_submission(
  p_submission_id uuid,
  p_note text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_list_id uuid;
  v_build_id uuid;
  v_submitted_by uuid;
  v_position int;
BEGIN

  -- lock the submission row
  SELECT
    list_id,
    build_id,
    submitted_by
  INTO
    v_list_id,
    v_build_id,
    v_submitted_by
  FROM public.build_list_submissions
  WHERE id = p_submission_id
    AND status = 'pending'
  FOR UPDATE;

  IF v_list_id IS NULL THEN
    RAISE EXCEPTION 'Submission not found or already reviewed';
  END IF;

  -- determine next position
  SELECT COALESCE(MAX(position) + 1, 1)
  INTO v_position
  FROM public.build_list_items
  WHERE list_id = v_list_id;

  -- insert into list
  INSERT INTO public.build_list_items (
    list_id,
    build_id,
    note,
    submitted_by,
    position
  )
  VALUES (
    v_list_id,
    v_build_id,
    p_note,
    v_submitted_by,
    v_position
  );

  -- mark submission as approved
  UPDATE public.build_list_submissions
  SET
    status = 'approved',
    reviewed_by = auth.uid(),
    reviewed_at = now()
  WHERE id = p_submission_id;

  -- reject all other submissions of the same build
  UPDATE public.build_list_submissions
  SET
    status = 'rejected',
    reviewed_by = auth.uid(),
    reviewed_at = now()
  WHERE list_id = v_list_id
    AND build_id = v_build_id
    AND status = 'pending';
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_build_list_submission(
  p_submission_id uuid
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.build_list_submissions
  SET
    status = 'rejected',
    reviewed_by = auth.uid(),
    reviewed_at = now()
  WHERE id = p_submission_id
    AND status = 'pending'
$$;

CREATE OR REPLACE FUNCTION public.reject_build_list_submissions_for_build(
  p_list_id uuid,
  p_build_id uuid
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.build_list_submissions
  SET
    status = 'rejected',
    reviewed_by = auth.uid(),
    reviewed_at = now()
  WHERE list_id = p_list_id
    AND build_id = p_build_id
    AND status = 'pending';
$$;

CREATE OR REPLACE FUNCTION handle_build_list_submission_notifications()
RETURNS TRIGGER AS $$
DECLARE
  list_owner UUID;
  existing_notif UUID;
BEGIN

  -- Get list owner
  SELECT user_id INTO list_owner
  FROM public.build_lists
  WHERE id = NEW.list_id;

  -- Don't notify yourself
  IF list_owner IS NULL OR list_owner = NEW.submitted_by THEN
    RETURN NEW;
  END IF;

  -- Check existing unread notification
  SELECT id INTO existing_notif
  FROM public.notifications
  WHERE user_id = list_owner
    AND target_type = 'build_list'
    AND target_id = NEW.list_id
    AND type = 'build_list_submission'
    AND is_read = FALSE
  LIMIT 1;

  IF existing_notif IS NOT NULL THEN
    UPDATE public.notifications
    SET actor_ids = array_append(actor_ids, NEW.submitted_by),
        created_at = NOW()
    WHERE id = existing_notif
      AND NOT (NEW.submitted_by = ANY(actor_ids));
  ELSE
    INSERT INTO public.notifications (
      user_id,
      actor_ids,
      target_type,
      target_id,
      type
    )
    VALUES (
      list_owner,
      ARRAY[NEW.submitted_by],
      'build_list',
      NEW.list_id,
      'build_list_submission'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_build_list_submission_notifications
AFTER INSERT ON public.build_list_submissions
FOR EACH ROW
EXECUTE FUNCTION handle_build_list_submission_notifications();

CREATE OR REPLACE FUNCTION handle_build_list_submission_review_notifications()
RETURNS TRIGGER AS $$
DECLARE
  existing_notif UUID;
  notif_type notification_type_enum;
BEGIN

  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'approved' THEN
    notif_type := 'build_list_submission_approved';
  ELSIF NEW.status = 'rejected' THEN
    notif_type := 'build_list_submission_rejected';
  ELSE
    RETURN NEW;
  END IF;

  -- Don't notify yourself
  IF NEW.submitted_by IS NULL OR NEW.submitted_by = NEW.reviewed_by THEN
    RETURN NEW;
  END IF;

  -- Find existing notification
  SELECT id INTO existing_notif
  FROM public.notifications
  WHERE user_id = NEW.submitted_by
    AND target_type = 'build_list'
    AND target_id = NEW.list_id
    AND type = notif_type
    AND is_read = FALSE
  LIMIT 1;

  IF existing_notif IS NOT NULL THEN
    UPDATE public.notifications
    SET actor_ids = array_append(actor_ids, NEW.reviewed_by),
        created_at = NOW()
    WHERE id = existing_notif
      AND NOT (NEW.reviewed_by = ANY(actor_ids));
  ELSE
    INSERT INTO public.notifications (
      user_id,
      actor_ids,
      target_type,
      target_id,
      type
    )
    VALUES (
      NEW.submitted_by,
      ARRAY[NEW.reviewed_by],
      'build_list',
      NEW.list_id,
      notif_type
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_build_list_submission_review_notifications
AFTER UPDATE OF status ON public.build_list_submissions
FOR EACH ROW
EXECUTE FUNCTION handle_build_list_submission_review_notifications();