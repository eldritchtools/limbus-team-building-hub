create table public.build_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,

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
  p_sort_by text default null,
  p_limit int default 20,
  p_offset int default 0,
  p_ignore_block_discovery boolean default false
)
returns table (
  id uuid,
  user_id uuid,
  title text,
  body text,
  created_at timestamptz,
  view_count integer,
  tags jsonb
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
  select
    bl.id,
    bl.user_id,
    bl.title,
    bl.body,
    bl.created_at,
    bl.view_count,
    'tags', coalesce(
      jsonb_agg(
        distinct jsonb_build_object(
          'id', t.id,
          'name', t.name
        )
      ) filter (where t.id is not null),
      '[]'::jsonb
    )
  from public.build_lists bl
  left join public.build_list_tags blt on bl.id = blt.list_id
  left join public.tags t on blt.tag_id = t.id
  where bl.is_published = true
    and (
      -- Search filter
      v_tsquery is null
      or bl.search_vector @@ v_tsquery
    )
    AND (
        p_ignore_block_discovery = TRUE
        OR bl.block_discovery = FALSE
    )
  order by
    case when v_sort = 'search' then ts_rank(bl.search_vector, v_tsquery) end desc,
    case when v_sort = 'new' then bl.created_at end desc,
    case when v_sort = 'popular' then bl.view_count end desc,
    case when v_sort = 'random' then random() end
  limit p_limit
  offset p_offset;

end;
$$;

create or replace function public.create_build_list(
  p_title text,
  p_body text,
  p_is_published boolean,
  p_items jsonb
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
begin
  -- get username for search vector
  select username into v_username
  from public.users
  where id = v_user_id;

  insert into public.build_lists (
    user_id,
    title,
    body,
    is_published,
    published_at,
    search_vector
  )
  values (
    v_user_id,
    p_title,
    p_body,
    p_is_published,
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
  
  insert into public.build_list_tags (list_id, tag_id) select p_list_id, unnest(p_tag_ids);

  return v_list_id;
end;
$$;

create or replace function public.update_build_list(
  p_list_id uuid,
  p_title text,
  p_body text,
  p_is_published boolean,
  p_items jsonb
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
      is_published = p_is_published,
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

  delete from public.build_list_tags where list_id = p_list_id;
  insert into public.build_list_tags (list_id, tag_id) select p_list_id, unnest(p_tag_ids);
end;
$$;

create or replace function public.get_build_list(
  p_list_id uuid
)
returns table (
  id uuid,
  user_id uuid,
  title text,
  body text,
  is_published boolean,
  created_at timestamptz,
  published_at timestamptz,
  updated_at timestamptz,
  view_count integer,
  tags jsonb
)
language plpgsql
security definer
as $$
declare
  v_user_id uuid := auth.uid();
begin
  update public.build_lists
  set view_count = view_count + 1
  where id = p_list_id
    and is_published = true
    and (
      v_user_id is null
      or user_id <> v_user_id
    );

  return query
  select
    bl.id,
    bl.user_id,
    bl.title,
    bl.body,
    bl.is_published,
    bl.created_at,
    bl.published_at,
    bl.updated_at,
    case
      when bl.user_id = v_user_id
      then bl.view_count
      else null
    end,
    'tags', coalesce(
      jsonb_agg(
        distinct jsonb_build_object(
          'id', t.id,
          'name', t.name
        )
      ) filter (where t.id is not null),
      '[]'::jsonb
    )
  from public.build_lists bl
  left join public.build_list_tags blt on bl.id = blt.list_id
  left join public.tags t on blt.tag_id = t.id
  where bl.id = p_list_id;
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