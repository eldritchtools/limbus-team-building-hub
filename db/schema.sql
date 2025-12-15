-- ========================
-- 1. USER TABLES
-- ========================

-- Extend Supabase Auth users
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- 2. CONTENT
-- ========================

CREATE TABLE public.builds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  identity_ids INTEGER[] DEFAULT '{}',
  ego_ids INTEGER[] DEFAULT '{}',
  keyword_ids INTEGER[] DEFAULT '{}',
  deployment_order INTEGER[] DEFAULT '{}',
  active_sinners INTEGER NOT NULL,
  team_code TEXT,
  youtube_video_id TEXT,
  extra_opts TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  score NUMERIC DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE
);

ALTER TABLE public.builds
ADD CONSTRAINT youtube_id_format CHECK (
  youtube_video_id IS NULL OR
  youtube_video_id ~ '^[a-zA-Z0-9_-]{6,}$'
);

-- ========================
-- 3. LIKES, COMMENTS & TAGS
-- ========================

CREATE TABLE public.likes (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  build_id UUID REFERENCES public.builds(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, build_id)
);

CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  build_id UUID REFERENCES public.builds(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  deleted BOOLEAN DEFAULT FALSE,
  edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  parent_id UUID REFERENCES public.comments(id) ON DELETE SET NULL
);

ALTER TABLE public.builds
ADD COLUMN pinned_comment_id UUID DEFAULT NULL,
ADD CONSTRAINT fk_pinned_comment
FOREIGN KEY (pinned_comment_id)
REFERENCES public.comments(id)
ON DELETE SET NULL;

CREATE TABLE public.saves (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  build_id UUID REFERENCES public.builds(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, build_id)
);

CREATE TABLE public.tags (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.build_tags (
  build_id UUID REFERENCES public.builds(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (build_id, tag_id)
);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_ids UUID[] DEFAULT '{}',
  build_id UUID REFERENCES builds(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('comment', 'reply')),
  parent_comment_id UUID REFERENCES comments(id),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- 4. OPTIONAL CACHES
-- ========================

CREATE TABLE public.popular_builds_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  build_id UUID NOT NULL REFERENCES public.builds(id) ON DELETE CASCADE,
  score NUMERIC NOT NULL,
  ranking_type TEXT DEFAULT 'all_time', -- 'all_time', 'weekly', etc.
  computed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- 5. INDEXES
-- ========================

CREATE INDEX idx_builds_created_at ON public.builds (created_at DESC);
CREATE INDEX idx_builds_like_count ON public.builds (like_count DESC);

CREATE INDEX idx_comments_build_id ON public.comments (build_id);
CREATE INDEX idx_comments_created_at ON public.comments (created_at DESC);
CREATE INDEX idx_saves_user_id ON public.saves(user_id);

CREATE INDEX idx_tags_name ON public.tags (name);
CREATE INDEX idx_build_tags_build_id ON public.build_tags (build_id);
CREATE INDEX idx_build_tags_tag_id ON public.build_tags (tag_id);

CREATE INDEX idx_builds_score_created_at ON public.builds (score DESC, created_at DESC);
CREATE INDEX idx_builds_identities ON builds USING GIN (identity_ids);
CREATE INDEX idx_builds_egos ON builds USING GIN (ego_ids);
CREATE INDEX idx_builds_keywords ON builds USING GIN (keyword_ids);

CREATE UNIQUE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_popular_builds_cache_score ON public.popular_builds_cache (score DESC);
CREATE INDEX idx_popular_builds_cache_computed_at ON public.popular_builds_cache (computed_at DESC);
CREATE INDEX idx_popular_builds_cache_ranking_type ON public.popular_builds_cache (ranking_type);

-- ========================
-- 6. TRIGGERS & FUNCTIONS
-- ========================

-- Function: update like count and score when likes change
CREATE OR REPLACE FUNCTION public.update_build_like_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  build_id_to_update UUID;
  new_like_count INT;
BEGIN
  build_id_to_update := COALESCE(NEW.build_id, OLD.build_id);

  -- compute the like count once
  SELECT COUNT(*) INTO new_like_count
  FROM public.likes
  WHERE build_id = build_id_to_update;

  UPDATE public.builds
  SET
    like_count = new_like_count,
    score = (new_like_count * 2 + comment_count) / POWER( (EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400) + 2, 1.05 )
  WHERE id = build_id_to_update;

  RETURN NULL;
END;
$$;



-- Triggers for like insert/delete
CREATE TRIGGER trg_like_insert
AFTER INSERT ON public.likes
FOR EACH ROW EXECUTE FUNCTION public.update_build_like_stats();

CREATE TRIGGER trg_like_delete
AFTER DELETE ON public.likes
FOR EACH ROW EXECUTE FUNCTION public.update_build_like_stats();


-- Function: update comment count and score when comments change
CREATE OR REPLACE FUNCTION public.update_build_comment_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  build_id_to_update UUID;
  new_comment_count INT;
BEGIN
  build_id_to_update := COALESCE(NEW.build_id, OLD.build_id);

  -- compute the comment count once
  SELECT COUNT(*) INTO new_comment_count
  FROM public.comments
  WHERE build_id = build_id_to_update AND NOT deleted;

  UPDATE public.builds
  SET
    comment_count = new_comment_count,
    score = (like_count * 2 + new_comment_count) / POWER( (EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400) + 2, 1.05 )

  WHERE id = build_id_to_update;

  RETURN NULL;
END;
$$;


-- Triggers for comment insert/delete
CREATE TRIGGER trg_comment_insert
AFTER INSERT ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.update_build_comment_stats();

CREATE TRIGGER trg_comment_delete
AFTER DELETE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.update_build_comment_stats();

-- Update = handle soft deletes (deleted flag toggled)
CREATE TRIGGER trg_comment_update
AFTER UPDATE OF deleted ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.update_build_comment_stats();
