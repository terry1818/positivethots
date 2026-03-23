-- Fix 1: Restrict user_photos public SELECT to authenticated only
DROP POLICY IF EXISTS "Anyone can view approved public photos" ON public.user_photos;

CREATE POLICY "Authenticated users can view approved public photos"
ON public.user_photos FOR SELECT
TO authenticated
USING (visibility = 'public' AND moderation_status = 'approved');

-- Fix 2: Remove direct INSERT on user_badges, create server-side RPC
DROP POLICY IF EXISTS "Users can earn badges" ON public.user_badges;

CREATE OR REPLACE FUNCTION public.award_badge(_module_id uuid, _quiz_score integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _total_questions integer;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF _quiz_score < 80 THEN
    RAISE EXCEPTION 'Score too low: must be >= 80%%';
  END IF;

  SELECT count(*) INTO _total_questions
  FROM public.quiz_questions
  WHERE module_id = _module_id;

  IF _total_questions = 0 THEN
    RAISE EXCEPTION 'No quiz questions found for this module';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.xp_transactions
    WHERE user_id = _user_id
      AND source IN ('quiz_completion', 'section_complete', 'quiz_pass', 'quiz_perfect')
  ) THEN
    RAISE EXCEPTION 'No learning activity found';
  END IF;

  INSERT INTO public.user_badges (user_id, module_id, quiz_score, attempt_count, last_attempt_at)
  VALUES (_user_id, _module_id, _quiz_score, 1, now())
  ON CONFLICT (user_id, module_id) DO UPDATE
  SET quiz_score = GREATEST(user_badges.quiz_score, EXCLUDED.quiz_score),
      attempt_count = user_badges.attempt_count + 1,
      last_attempt_at = now();
END;
$$;