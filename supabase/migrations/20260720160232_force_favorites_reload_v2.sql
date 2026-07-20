/*
# Force PostgREST schema cache reload via comment + re-notify

PostgREST listens on the "pgrst" channel for "reload schema" commands.
Some Supabase versions also respond to schema changes via event triggers.
This migration adds a comment to the favorites table and re-sends the notify.
*/

COMMENT ON TABLE public.favorites IS 'User favorites - saved individual posts from content plans';

NOTIFY pgrst, 'reload schema';
