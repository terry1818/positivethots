
-- Add reflection_prompt column to module_sections
ALTER TABLE public.module_sections
  ADD COLUMN IF NOT EXISTS reflection_prompt TEXT;

-- Create user_reflections table
CREATE TABLE public.user_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  section_id UUID REFERENCES public.module_sections(id) ON DELETE CASCADE,
  response_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, section_id)
);

-- Enable RLS
ALTER TABLE public.user_reflections ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can select own reflections"
  ON public.user_reflections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reflections"
  ON public.user_reflections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reflections"
  ON public.user_reflections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
