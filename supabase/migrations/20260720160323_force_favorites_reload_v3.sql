/*
# Force schema cache reload v3

Making a significant DDL change to force PostgREST to reload its schema cache.
This recreates the favorites table's indexes which should trigger the event trigger.
*/

-- Drop and recreate indexes to force DDL event
DROP INDEX IF EXISTS favorites_user_plan_post_idx;
DROP INDEX IF EXISTS favorites_user_created_idx;

CREATE UNIQUE INDEX favorites_user_plan_post_idx
  ON public.favorites (user_id, content_plan_id, post_id);

CREATE INDEX favorites_user_created_idx
  ON public.favorites (user_id, created_at DESC);

-- Re-add comment to trigger COMMENT event
COMMENT ON TABLE public.favorites IS 'User favorites - saved individual posts from content plans';

NOTIFY pgrst, 'reload schema';
