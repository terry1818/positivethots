
-- Add exercise type column with validation
ALTER TABLE quiz_questions
ADD COLUMN IF NOT EXISTS exercise_type TEXT NOT NULL DEFAULT 'multiple_choice';

-- Add match_pairs for drag_match exercises
ALTER TABLE quiz_questions
ADD COLUMN IF NOT EXISTS match_pairs JSONB;

-- Add correct_order for reorder exercises
ALTER TABLE quiz_questions
ADD COLUMN IF NOT EXISTS correct_order JSONB;

-- Add explanation for post-answer feedback
ALTER TABLE quiz_questions
ADD COLUMN IF NOT EXISTS explanation TEXT;

-- Create validation trigger for exercise_type
CREATE OR REPLACE FUNCTION public.validate_exercise_type()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.exercise_type NOT IN (
    'multiple_choice', 'drag_match', 'scenario_choice',
    'true_false_rapid', 'fill_blank', 'reorder'
  ) THEN
    RAISE EXCEPTION 'Invalid exercise_type: %', NEW.exercise_type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_quiz_exercise_type
BEFORE INSERT OR UPDATE ON quiz_questions
FOR EACH ROW
EXECUTE FUNCTION public.validate_exercise_type();

-- Track user performance per question
CREATE TABLE IF NOT EXISTS public.user_quiz_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES education_modules(id) ON DELETE CASCADE,
  is_correct BOOLEAN NOT NULL,
  time_taken_ms INTEGER,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id, attempt_number)
);

ALTER TABLE public.user_quiz_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own performance"
  ON public.user_quiz_performance FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own performance"
  ON public.user_quiz_performance FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_quiz_perf_user_module
  ON public.user_quiz_performance(user_id, module_id);

CREATE INDEX idx_quiz_perf_user_question
  ON public.user_quiz_performance(user_id, question_id, is_correct);
