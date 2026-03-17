-- ========================
-- 1. USER TABLES
-- ========================

-- Extend Supabase Auth users
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE,
  flair TEXT DEFAULT NULL,
  description TEXT DEFAULT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  socials JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users
ADD CONSTRAINT flair_length CHECK (char_length(flair) <= 32);

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
  published_at TIMESTAMPTZ DEFAULT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  score NUMERIC DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  view_count INTEGER NOT NULL DEFAULT 0,
  block_discovery BOOLEAN NOT NULL DEFAULT FALSE
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
  target_type target_type_enum,
  target_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, target_id)
);

CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id UUID REFERENCES public.builds(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  target_type target_type_enum,
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
  target_type target_type_enum,
  target_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, target_id)
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
  target_type target_type_enum,
  target_id UUID,
  type TEXT NOT NULL CHECK (type IN ('comment', 'reply')),
  parent_comment_id UUID REFERENCES comments(id),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE notification_type_enum AS ENUM (
  'comment',
  'reply',
  'build_list_submission',
  'build_list_submission_approved',
  'build_list_submission_rejected'
);

CREATE TYPE target_type_enum AS ENUM (
  'build',
  'build_list'
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

CREATE INDEX idx_likes_target ON public.likes (target_type, target_id);
CREATE INDEX idx_comments_target_created_at ON public.comments (target_type, target_id, created_at) WHERE deleted = false;
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

CREATE OR REPLACE FUNCTION public.update_target_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    tgt_type target_type_enum;
    tgt_id UUID;
    new_like_count INT;
    new_comment_count INT;
BEGIN
    tgt_type := COALESCE(NEW.target_type, OLD.target_type);
    tgt_id   := COALESCE(NEW.target_id, OLD.target_id);

    -- Handle builds
    IF tgt_type = 'build' THEN
        IF TG_TABLE_NAME = 'likes' THEN
            SELECT COUNT(*) INTO new_like_count
            FROM public.likes
            WHERE target_type = 'build' AND target_id = tgt_id;

            SELECT comment_count INTO new_comment_count
            FROM public.builds
            WHERE id = tgt_id;
        ELSIF TG_TABLE_NAME = 'comments' THEN
            SELECT COUNT(*) INTO new_comment_count
            FROM public.comments
            WHERE target_type = 'build' AND target_id = tgt_id AND NOT deleted;

            SELECT like_count INTO new_like_count
            FROM public.builds
            WHERE id = tgt_id;
        END IF;

        UPDATE public.builds
        SET
            like_count = new_like_count,
            comment_count = new_comment_count,
            score = (new_like_count * 2 + new_comment_count)
                    / POWER((EXTRACT(EPOCH FROM (NOW() - COALESCE(published_at, created_at))) / 86400) + 2, 1.05)
        WHERE id = tgt_id;

    -- Handle collections
    ELSIF tgt_type = 'collection' THEN
        IF TG_TABLE_NAME = 'likes' THEN
            SELECT COUNT(*) INTO new_like_count
            FROM public.likes
            WHERE target_type = 'collection' AND target_id = tgt_id;

            SELECT comment_count INTO new_comment_count
            FROM public.collections
            WHERE id = tgt_id;
        ELSIF TG_TABLE_NAME = 'comments' THEN
            SELECT COUNT(*) INTO new_comment_count
            FROM public.comments
            WHERE target_type = 'collection' AND target_id = tgt_id AND NOT deleted;

            SELECT like_count INTO new_like_count
            FROM public.collections
            WHERE id = tgt_id;
        END IF;

        UPDATE public.collections
        SET
            like_count = new_like_count,
            comment_count = new_comment_count,
            score = (new_like_count * 2 + new_comment_count)
                    / POWER((EXTRACT(EPOCH FROM (NOW() - COALESCE(published_at, created_at))) / 86400) + 2, 1.05)
        WHERE id = tgt_id;

    ELSIF tgt_type = 'md_plan' THEN
        IF TG_TABLE_NAME = 'likes' THEN
            SELECT COUNT(*) INTO new_like_count
            FROM public.likes
            WHERE target_type = 'md_plan' AND target_id = tgt_id;

            SELECT comment_count INTO new_comment_count
            FROM public.md_plans
            WHERE id = tgt_id;
        ELSIF TG_TABLE_NAME = 'comments' THEN
            SELECT COUNT(*) INTO new_comment_count
            FROM public.comments
            WHERE target_type = 'md_plan' AND target_id = tgt_id AND NOT deleted;

            SELECT like_count INTO new_like_count
            FROM public.md_plans
            WHERE id = tgt_id;
        END IF;

        UPDATE public.md_plans
        SET
            like_count = new_like_count,
            comment_count = new_comment_count,
            score = (new_like_count * 2 + new_comment_count)
                    / POWER((EXTRACT(EPOCH FROM (NOW() - COALESCE(published_at, created_at))) / 86400) + 2, 1.05)
        WHERE id = tgt_id;
    END IF;

    RETURN NULL;
END;
$$;

-- Likes triggers
DROP TRIGGER IF EXISTS trg_like_insert ON public.likes;
DROP TRIGGER IF EXISTS trg_like_delete ON public.likes;

CREATE TRIGGER trg_like_insert
AFTER INSERT ON public.likes
FOR EACH ROW EXECUTE FUNCTION public.update_target_stats();

CREATE TRIGGER trg_like_delete
AFTER DELETE ON public.likes
FOR EACH ROW EXECUTE FUNCTION public.update_target_stats();

-- Comments triggers
DROP TRIGGER IF EXISTS trg_comment_insert ON public.comments;
DROP TRIGGER IF EXISTS trg_comment_delete ON public.comments;
DROP TRIGGER IF EXISTS trg_comment_update ON public.comments;

CREATE TRIGGER trg_comment_insert
AFTER INSERT ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.update_target_stats();

CREATE TRIGGER trg_comment_delete
AFTER DELETE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.update_target_stats();

CREATE TRIGGER trg_comment_update
AFTER UPDATE OF deleted ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.update_target_stats();