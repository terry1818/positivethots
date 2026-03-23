
CREATE OR REPLACE FUNCTION public.submit_quiz(_module_id uuid, _answers jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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

  -- Validate _answers is a non-empty array of {question_id, selected_answer}
  IF _answers IS NULL OR jsonb_array_length(_answers) = 0 THEN
    RAISE EXCEPTION 'No answers provided';
  END IF;

  -- Count total questions for this module
  SELECT count(*) INTO _total_questions
  FROM public.quiz_questions
  WHERE module_id = _module_id;

  IF _total_questions = 0 THEN
    RAISE EXCEPTION 'No quiz questions found for this module';
  END IF;

  -- Validate that submitted answer count matches question count
  IF jsonb_array_length(_answers) != _total_questions THEN
    RAISE EXCEPTION 'Must answer all questions';
  END IF;

  -- Validate each answer server-side
  FOR _answer IN
    SELECT
      (elem->>'question_id')::uuid AS question_id,
      (elem->>'selected_answer')::integer AS selected_answer
    FROM jsonb_array_elements(_answers) AS elem
  LOOP
    -- Verify the question belongs to this module
    IF NOT EXISTS (
      SELECT 1 FROM public.quiz_questions
      WHERE id = _answer.question_id AND module_id = _module_id
    ) THEN
      RAISE EXCEPTION 'Invalid question for this module';
    END IF;

    -- Check if answer is correct
    IF EXISTS (
      SELECT 1 FROM public.quiz_questions
      WHERE id = _answer.question_id
        AND correct_answer = _answer.selected_answer
    ) THEN
      _correct_count := _correct_count + 1;
    END IF;
  END LOOP;

  _score_percent := ROUND((_correct_count::numeric / _total_questions) * 100);

  -- Award badge if score >= 80
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
$$;
