create table public.build_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  short_desc TEXT,

  is_published BOOLEAN DEFAULT TRUE,

  search_vector tsvector,
  view_count INTEGER NOT NULL DEFAULT 0,
  block_discovery BOOLEAN NOT NULL DEFAULT FALSE,

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

create or replace function public.search_build_lists(
  p_query text default null,
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
  username TEXT,
  user_flair TEXT,
  title text,
  short_desc text,
  created_at timestamptz,
  published_at timestamptz,
  tags TEXT[],
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
      bl.created_at,
      bl.published_at,
      bl.search_vector,
      CASE
        WHEN v_sort = 'search' AND v_tsquery IS NOT NULL THEN ts_rank(bl.search_vector, v_tsquery)
        WHEN v_sort = 'new' THEN EXTRACT(EPOCH FROM COALESCE(bl.published_at, bl.created_at))
        WHEN v_sort = 'popular' THEN bl.view_count
        WHEN v_sort = 'random' THEN RANDOM()
      END AS sort_value 
    FROM public.build_lists bl
    JOIN public.users u ON bl.user_id = u.id
    WHERE bl.is_published = p_published
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
    l.username,
    l.flair AS user_flair,
    l.title,
    l.short_desc,
    l.created_at,
    l.published_at,
    COALESCE(lt.tags, ARRAY[]::TEXT[]) AS tags,
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
    l.username,
    l.flair,
    l.title,
    l.short_desc,
    l.created_at,
    l.published_at,
    lt.tags,
    lb.build_ids,
    l.sort_value
  ORDER BY l.sort_value DESC;
end;
$$;

create or replace function public.create_build_list(
  p_title text,
  p_body text,
  p_short_desc text,
  p_is_published boolean,
  p_block_discovery boolean,
  p_items jsonb,
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
      position
    )
    values (
      v_list_id,
      (v_item->>'build_id')::uuid,
      v_item->>'note',
      v_position
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

create or replace function public.update_build_list(
  p_list_id uuid,
  p_title text,
  p_body text,
  p_short_desc text,
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
      position
    )
    values (
      p_list_id,
      (v_item->>'build_id')::uuid,
      v_item->>'note',
      v_position
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

create or replace function public.get_build_list(
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
      bl.is_published,
      bl.created_at,
      bl.published_at,
      bl.updated_at,
      bl.view_count,
      bl.block_discovery
    FROM public.build_lists bl
    JOIN public.users u ON bl.user_id = u.id
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
          'note', bli.note
        )
        ORDER BY array_position(lb.build_ids, b.id)
      ) AS items
    FROM list_builds lb
    JOIN public.build_list_items bli
      ON bli.list_id = lb.list_id
    LEFT JOIN builds b
      ON b.id = bli.build_id
  )

  SELECT jsonb_build_object(
    'id', l.id,
    'user_id', l.user_id,
    'username', l.username,
    'user_flair', l.flair,
    'title', l.title,
    'body', l.body,
    'short_desc', l.short_desc,
    'is_published', l.is_published,
    'created_at', l.created_at,
    'published_at', l.published_at,
    'updated_at', l.updated_at,
    'view_count',
      CASE
        WHEN l.user_id = v_user_id THEN l.view_count
        ELSE NULL
      END,
    'block_discovery', l.block_discovery,
    'tags', COALESCE(lt.tags, '[]'::jsonb),
    'items', COALESCE(i.items, '[]'::jsonb)
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

