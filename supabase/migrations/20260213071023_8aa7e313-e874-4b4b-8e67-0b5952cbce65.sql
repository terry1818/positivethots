-- Add section_id to quiz_questions for per-section quizzes
ALTER TABLE public.quiz_questions
ADD COLUMN IF NOT EXISTS section_id uuid REFERENCES public.module_sections(id) ON DELETE CASCADE;

-- Create index for section-based quiz lookups
CREATE INDEX IF NOT EXISTS idx_quiz_questions_section_id ON public.quiz_questions(section_id);
