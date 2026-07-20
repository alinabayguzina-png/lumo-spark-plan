/*
# Create favorites table (saved posts)

1. New Tables
- `favorites`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to auth.uid(), references auth.users, cascade delete)
  - `plan_id` (uuid, not null, references content_plans, cascade delete)
  - `post_index` (integer, not null — the index of the saved post within the plan's posts JSONB array)
  - `post_snapshot` (jsonb, not null — a copy of the saved post's data so it survives plan edits)
  - `plan_title` (text — denormalized plan title for display in Favorites)
  - `created_at` (timestamptz, default now())
  - Unique constraint on (user_id, plan_id, post_index) so a post can only be favorited once per user.

2. Security
- Enable RLS on `favorites`.
- Owner-scoped CRUD: each authenticated user can only access their own favorites.
- 4 separate policies (select/insert/update/delete), all TO authenticated with auth.uid() = user_id.
- user_id defaults to auth.uid() so client inserts omitting user_id still satisfy the INSERT WITH CHECK.

3. Indexes
- (user_id, created_at desc) for listing a user's favorites.
- (user_id, plan_id, post_index) for the unique constraint + toggle lookups.
*/

CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.content_plans(id) ON DELETE CASCADE,
  post_index INTEGER NOT NULL,
  post_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  plan_title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS favorites_user_plan_post_idx
  ON public.favorites (user_id, plan_id, post_index);

CREATE INDEX IF NOT EXISTS favorites_user_created_idx
  ON public.favorites (user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_favorites" ON public.favorites;
CREATE POLICY "select_own_favorites" ON public.favorites FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_favorites" ON public.favorites;
CREATE POLICY "insert_own_favorites" ON public.favorites FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_favorites" ON public.favorites;
CREATE POLICY "update_own_favorites" ON public.favorites FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_favorites" ON public.favorites;
CREATE POLICY "delete_own_favorites" ON public.favorites FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
