ALTER TABLE public.module_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_section_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read module sections" ON public.module_sections;
CREATE POLICY "Anyone can read module sections"
  ON public.module_sections FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role can manage module sections" ON public.module_sections;
CREATE POLICY "Service role can manage module sections"
  ON public.module_sections FOR ALL
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can read own section progress" ON public.user_section_progress;
CREATE POLICY "Users can read own section progress"
  ON public.user_section_progress FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own section progress" ON public.user_section_progress;
CREATE POLICY "Users can insert own section progress"
  ON public.user_section_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own section progress" ON public.user_section_progress;
CREATE POLICY "Users can update own section progress"
  ON public.user_section_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);