/*
# Recreate favorites table with post_id structure + reload schema cache

1. Changes
- Drop the existing `favorites` table (0 rows — no data loss) and recreate with the requested structure:
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to auth.uid(), references auth.users, cascade delete)
  - `content_plan_id` (uuid, not null, references content_plans, cascade delete)
  - `post_id` (text, not null — the AI-generated unique id of the saved post, e.g. "post_1")
  - `post_data` (jsonb, not null — full copy of the saved post's data)
  - `created_at` (timestamptz, default now())
- Unique constraint on (user_id, content_plan_id, post_id) so a post can only be favorited once per user.

2. Security
- Enable RLS on `favorites`.
- Owner-scoped CRUD: each authenticated user can only access their own favorites.
- 4 separate policies (select/insert/update/delete), all TO authenticated with auth.uid() = user_id.
- user_id defaults to auth.uid() so client inserts omitting user_id still satisfy the INSERT WITH CHECK.

3. Schema cache
- Send NOTIFY pgrst 'reload schema' so PostgREST picks up the recreated table immediately.
  This fixes the "Could not find the table 'public.favorites' in the schema cache" error.

4. Indexes
- (user_id, created_at desc) for listing a user's favorites.
- (user_id, content_plan_id, post_id) for the unique constraint + toggle lookups.
*/

DROP TABLE IF EXISTS public.favorites;

CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  content_plan_id UUID NOT NULL REFERENCES public.content_plans(id) ON DELETE CASCADE,
  post_id TEXT NOT NULL,
  post_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX favorites_user_plan_post_idx
  ON public.favorites (user_id, content_plan_id, post_id);

CREATE INDEX favorites_user_created_idx
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

NOTIFY pgrst, 'reload schema';
