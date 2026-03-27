CREATE TABLE public.profile_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  prompt_question TEXT NOT NULL,
  prompt_response TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, prompt_question)
);

ALTER TABLE public.profile_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view prompts"
  ON public.profile_prompts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own prompts"
  ON public.profile_prompts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prompts"
  ON public.profile_prompts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own prompts"
  ON public.profile_prompts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);