/*
# Force PostgREST schema cache reload for favorites table

The favorites table exists but PostgREST hasn't refreshed its schema cache.
This migration makes a trivial DDL change to force a reload.
*/

-- Add and immediately remove a column to force PostgREST schema cache reload
ALTER TABLE public.favorites ADD COLUMN IF NOT EXISTS _cache_reload int;
ALTER TABLE public.favorites DROP COLUMN IF EXISTS _cache_reload;

-- Re-grant permissions to ensure they're registered
GRANT SELECT, INSERT, UPDATE, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;

-- Notify PostgREST to reload
NOTIFY pgrst, 'reload schema';
