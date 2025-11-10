-- USERS TABLE
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Only allow a user to view or update their own profile
CREATE POLICY "Users can view their own profile"
ON public.users
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Optionally, allow everyone to view usernames (for display purposes)
CREATE POLICY "Public can view usernames"
ON public.users
FOR SELECT
USING (true);



-- BUILDS TABLE
ALTER TABLE public.builds ENABLE ROW LEVEL SECURITY;

-- Anyone can view builds
CREATE POLICY "Public can read builds"
ON public.builds
FOR SELECT
USING (true);

-- Only owner can modify
CREATE POLICY "Owner can modify their builds"
ON public.builds
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can update their builds"
ON public.builds
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can delete their builds"
ON public.builds
FOR DELETE
USING (auth.uid() = user_id);



-- COMMENTS TABLE
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read comments
CREATE POLICY "Public can read comments"
ON public.comments
FOR SELECT
USING (true);

-- Only authenticated users can write comments
CREATE POLICY "Authenticated users can comment"
ON public.comments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Only comment owner can modify or delete
CREATE POLICY "Comment owners can update their comments"
ON public.comments
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Comment owners can delete their comments"
ON public.comments
FOR DELETE
USING (auth.uid() = user_id);



-- LIKES TABLE
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Anyone can read like counts (public)
CREATE POLICY "Public can read likes"
ON public.likes
FOR SELECT
USING (true);

-- Only logged-in users can like/unlike
CREATE POLICY "Users can manage their own likes"
ON public.likes
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);



-- SAVES TABLE
ALTER TABLE public.saves ENABLE ROW LEVEL SECURITY;

-- Only logged-in users can save/unsave
CREATE POLICY "Users can manage their own saves"
ON public.saves
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);



-- TAGS TABLE
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- Everyone can view tags
CREATE POLICY "Public can read tags"
ON public.tags
FOR SELECT
USING (true);

-- Authenticated users can create new tags
CREATE POLICY "Authenticated users can create tags"
ON public.tags
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Only admins can update or delete tags
CREATE POLICY "Admins can update tags"
ON public.tags
FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins can delete tags"
ON public.tags
FOR DELETE
USING (auth.role() = 'service_role');



-- BUILD_TAGS (build–tag relationship)
ALTER TABLE public.build_tags ENABLE ROW LEVEL SECURITY;

-- Everyone can read build-tag relationships
CREATE POLICY "Public can read build tags"
ON public.build_tags
FOR SELECT
USING (true);

-- Build owners can manage tags on their own builds
CREATE POLICY "Build owners can insert build tags"
ON public.build_tags
FOR INSERT
WITH CHECK (auth.uid() IN (
    SELECT user_id FROM public.builds WHERE builds.id = build_tags.build_id
));

CREATE POLICY "Build owners can delete build tags"
ON public.build_tags
FOR DELETE
USING (auth.uid() IN (
    SELECT user_id FROM public.builds WHERE builds.id = build_tags.build_id
));



-- POPULAR_BUILDS_CACHE
ALTER TABLE public.popular_builds_cache ENABLE ROW LEVEL SECURITY;

-- Public read access for cached results
CREATE POLICY "Public can read popular builds cache"
ON public.popular_builds_cache
FOR SELECT
USING (true);

-- Only the backend or cron job (service role) can modify cache entries
CREATE POLICY "Admins can manage popular builds cache"
ON public.popular_builds_cache
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins can update popular builds cache"
ON public.popular_builds_cache
FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins can delete popular builds cache"
ON public.popular_builds_cache
FOR DELETE
USING (auth.role() = 'service_role');
