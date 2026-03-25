
-- Fix submit_quiz to only count non-checkpoint questions
CREATE OR REPLACE FUNCTION public.submit_quiz(_module_id uuid, _answers jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _user_id uuid := auth.uid();
  _total_questions integer;
  _correct_count integer := 0;
  _score_percent integer;
  _answer record;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF _answers IS NULL OR jsonb_array_length(_answers) = 0 THEN
    RAISE EXCEPTION 'No answers provided';
  END IF;

  -- Count only non-checkpoint questions for this module
  SELECT count(*) INTO _total_questions
  FROM public.quiz_questions
  WHERE module_id = _module_id
    AND (is_checkpoint = false OR is_checkpoint IS NULL);

  IF _total_questions = 0 THEN
    RAISE EXCEPTION 'No quiz questions found for this module';
  END IF;

  IF jsonb_array_length(_answers) != _total_questions THEN
    RAISE EXCEPTION 'Must answer all questions';
  END IF;

  FOR _answer IN
    SELECT
      (elem->>'question_id')::uuid AS question_id,
      (elem->>'selected_answer')::integer AS selected_answer
    FROM jsonb_array_elements(_answers) AS elem
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.quiz_questions
      WHERE id = _answer.question_id AND module_id = _module_id
        AND (is_checkpoint = false OR is_checkpoint IS NULL)
    ) THEN
      RAISE EXCEPTION 'Invalid question for this module';
    END IF;

    IF EXISTS (
      SELECT 1 FROM public.quiz_questions
      WHERE id = _answer.question_id
        AND correct_answer = _answer.selected_answer
    ) THEN
      _correct_count := _correct_count + 1;
    END IF;
  END LOOP;

  _score_percent := ROUND((_correct_count::numeric / _total_questions) * 100);

  IF _score_percent >= 80 THEN
    INSERT INTO public.user_badges (user_id, module_id, quiz_score, attempt_count, last_attempt_at)
    VALUES (_user_id, _module_id, _score_percent, 1, now())
    ON CONFLICT (user_id, module_id) DO UPDATE
    SET quiz_score = GREATEST(user_badges.quiz_score, EXCLUDED.quiz_score),
        attempt_count = user_badges.attempt_count + 1,
        last_attempt_at = now();
  END IF;

  RETURN jsonb_build_object(
    'score', _score_percent,
    'correct', _correct_count,
    'total', _total_questions,
    'passed', _score_percent >= 80
  );
END;
$function$;

-- Fix award_badge to only count non-checkpoint questions
CREATE OR REPLACE FUNCTION public.award_badge(_module_id uuid, _quiz_score integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  WHERE module_id = _module_id
    AND (is_checkpoint = false OR is_checkpoint IS NULL);

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
$function$;
