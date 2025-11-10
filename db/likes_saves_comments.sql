-- ✅ Ensure RLS is enabled
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- ✅ Auto-inject current user id on insert
CREATE OR REPLACE FUNCTION public.set_user_id()
RETURNS trigger AS $$
BEGIN
  NEW.user_id := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ✅ Apply the trigger to each table
DROP TRIGGER IF EXISTS set_user_id_trigger_likes ON public.likes;
CREATE TRIGGER set_user_id_trigger_likes
BEFORE INSERT ON public.likes
FOR EACH ROW EXECUTE FUNCTION public.set_user_id();

DROP TRIGGER IF EXISTS set_user_id_trigger_saves ON public.saves;
CREATE TRIGGER set_user_id_trigger_saves
BEFORE INSERT ON public.saves
FOR EACH ROW EXECUTE FUNCTION public.set_user_id();

DROP TRIGGER IF EXISTS set_user_id_trigger_comments ON public.comments;
CREATE TRIGGER set_user_id_trigger_comments
BEFORE INSERT ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.set_user_id();

-- ✅ Likes Policies
CREATE POLICY "users can insert their own likes"
ON public.likes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can delete their own likes"
ON public.likes
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "users can view their own likes"
ON public.likes
FOR SELECT
USING (auth.uid() = user_id);

-- ✅ Saves Policies
CREATE POLICY "users can insert their own saves"
ON public.saves
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can delete their own saves"
ON public.saves
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "users can view their own saves"
ON public.saves
FOR SELECT
USING (auth.uid() = user_id);

-- ✅ Comments Policies
CREATE POLICY "users can insert their own comments"
ON public.comments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can delete their own comments"
ON public.comments
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "comments are viewable by everyone"
ON public.comments
FOR SELECT
USING (true);
