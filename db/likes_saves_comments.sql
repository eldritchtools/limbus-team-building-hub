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

CREATE OR REPLACE FUNCTION public.cleanup_target_rows()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_type target_type_enum := TG_ARGV[0]::target_type_enum;
BEGIN

  DELETE FROM public.likes l
  USING (SELECT OLD.id AS id) t
  WHERE l.target_id = t.id
    AND l.target_type = v_type;

  DELETE FROM public.saves s
  USING (SELECT OLD.id AS id) t
  WHERE s.target_id = t.id
    AND s.target_type = v_type;

  DELETE FROM public.comments c
  USING (SELECT OLD.id AS id) t
  WHERE c.target_id = t.id
    AND c.target_type = v_type;

  DELETE FROM public.notifications n
  USING (SELECT OLD.id AS id) t
  WHERE n.target_id = t.id
    AND n.target_type = v_type;

  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_cleanup_build
AFTER DELETE ON public.builds
FOR EACH ROW
EXECUTE FUNCTION public.cleanup_target_rows('build');

CREATE TRIGGER trg_cleanup_build_list
AFTER DELETE ON public.build_lists
FOR EACH ROW
EXECUTE FUNCTION public.cleanup_target_rows('build_list');