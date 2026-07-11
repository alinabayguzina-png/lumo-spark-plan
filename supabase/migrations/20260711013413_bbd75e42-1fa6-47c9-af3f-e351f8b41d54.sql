
CREATE TABLE public.detailed_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES public.content_plans(id) ON DELETE CASCADE,
  post_index INTEGER NOT NULL,
  kind TEXT NOT NULL,
  title TEXT,
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (plan_id, post_index)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.detailed_plans TO authenticated;
GRANT ALL ON public.detailed_plans TO service_role;
ALTER TABLE public.detailed_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own detailed_plans all" ON public.detailed_plans FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER detailed_plans_set_updated_at BEFORE UPDATE ON public.detailed_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX detailed_plans_user_created_idx ON public.detailed_plans (user_id, created_at DESC);
