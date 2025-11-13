CREATE OR REPLACE FUNCTION handle_comment_notifications()
RETURNS TRIGGER AS $$
DECLARE
  build_owner UUID;
  parent_owner UUID;
  existing_notif UUID;
BEGIN
  SELECT user_id INTO build_owner FROM public.builds WHERE id = NEW.build_id;

  IF NEW.parent_id IS NOT NULL THEN
    SELECT user_id INTO parent_owner FROM public.comments WHERE id = NEW.parent_id;
  END IF;

  -- ========================
  -- 1. Notify build owner
  -- ========================
  IF build_owner IS NOT NULL AND build_owner != NEW.user_id THEN
    SELECT id INTO existing_notif
    FROM public.notifications
    WHERE user_id = build_owner
      AND build_id = NEW.build_id
      AND type = 'comment'
      AND is_read = FALSE
    LIMIT 1;

    IF existing_notif IS NOT NULL THEN
      UPDATE public.notifications
      SET actor_ids = array_append(actor_ids, NEW.user_id),
          created_at = NOW()
      WHERE id = existing_notif
        AND NOT (NEW.user_id = ANY(actor_ids));
    ELSE
      INSERT INTO notifications (user_id, actor_ids, build_id, type)
      VALUES (build_owner, ARRAY[NEW.user_id], NEW.build_id, 'comment');
    END IF;
  END IF;

  -- ========================
  -- 2. Notify parent comment owner (for replies)
  -- ========================
  IF NEW.parent_id IS NOT NULL 
     AND parent_owner IS NOT NULL
     AND parent_owner != NEW.user_id
     AND parent_owner != build_owner THEN

    SELECT id INTO existing_notif
    FROM notifications
    WHERE user_id = parent_owner
      AND build_id = NEW.build_id
      AND parent_comment_id = NEW.parent_id
      AND type = 'reply'
      AND is_read = FALSE
    LIMIT 1;

    IF existing_notif IS NOT NULL THEN
      UPDATE notifications
      SET actor_ids = array_append(actor_ids, NEW.user_id),
          created_at = NOW()
      WHERE id = existing_notif
        AND NOT (NEW.user_id = ANY(actor_ids));
    ELSE
      INSERT INTO notifications (user_id, actor_ids, build_id, parent_comment_id, type)
      VALUES (parent_owner, ARRAY[NEW.user_id], NEW.build_id, NEW.parent_id, 'reply');
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


DROP TRIGGER IF EXISTS trigger_comment_notifications ON public.comments;

CREATE TRIGGER trigger_comment_notifications
AFTER INSERT ON public.comments
FOR EACH ROW
EXECUTE FUNCTION handle_comment_notifications();


CREATE OR REPLACE FUNCTION public.get_user_notifications(
  p_user_id UUID,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  type TEXT,
  actors TEXT[],
  build_id UUID,
  build_title TEXT,
  is_read BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY INVOKER
AS $$
  SELECT
    n.id,
    n.type,
    ARRAY_AGG(DISTINCT a.username ORDER BY a.username) AS actors,
    n.build_id,
    b.title AS build_title,
    n.is_read,
    n.created_at
  FROM public.notifications AS n
  JOIN public.builds AS b ON b.id = n.build_id
  LEFT JOIN LATERAL (
    SELECT u.username
    FROM public.users AS u
    WHERE u.id = ANY(n.actor_ids)
  ) AS a ON TRUE
  WHERE n.user_id = p_user_id
  GROUP BY n.id, n.type, n.build_id, b.title, n.is_read, n.created_at
  ORDER BY n.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can mark their own notifications as read"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


CREATE OR REPLACE FUNCTION public.cleanup_old_notifications(
  p_days_old INT DEFAULT 30
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE is_read = TRUE
    AND created_at < NOW() - (p_days_old || ' days')::INTERVAL;

  RAISE NOTICE 'Old notifications cleaned up (older than % days)', p_days_old;
END;
$$;

SELECT cron.schedule(
  'cleanup-old-notifications',
  '0 0 * * *',
  $$SELECT public.cleanup_old_notifications(30);$$
);