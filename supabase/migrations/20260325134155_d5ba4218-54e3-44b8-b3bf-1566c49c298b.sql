
-- Add explanation and checkpoint columns to quiz_questions
ALTER TABLE public.quiz_questions
  ADD COLUMN IF NOT EXISTS explanation_correct TEXT,
  ADD COLUMN IF NOT EXISTS explanation_wrong TEXT,
  ADD COLUMN IF NOT EXISTS is_checkpoint BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS position_in_section INTEGER DEFAULT NULL;

-- Recreate the public view to include new columns (excluding correct_answer)
DROP VIEW IF EXISTS public.quiz_questions_public;
CREATE VIEW public.quiz_questions_public
WITH (security_invoker = true) AS
  SELECT id, module_id, question, options, order_index, section_id,
         explanation_correct, explanation_wrong, is_checkpoint, position_in_section
  FROM public.quiz_questions;
