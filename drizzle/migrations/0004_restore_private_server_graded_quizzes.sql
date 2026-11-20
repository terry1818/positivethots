CREATE OR REPLACE FUNCTION public.require_quiz_user()
RETURNS uuid LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  RETURN auth.uid();
END;
$$;
REVOKE ALL ON FUNCTION public.require_quiz_user() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_quiz_questions(_module_id uuid)
RETURNS TABLE(id uuid, module_id uuid, question text, options jsonb, order_index integer, section_id uuid, is_checkpoint boolean, position_in_section integer, exercise_type text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT q.id, q.module_id, q.question, q.options, q.order_index, q.section_id, q.is_checkpoint, q.position_in_section, q.exercise_type
  FROM public.quiz_questions q
  WHERE q.module_id = _module_id
  ORDER BY q.order_index
  LIMIT (SELECT CASE WHEN public.require_quiz_user() IS NOT NULL THEN NULL::bigint END);
$$;
REVOKE ALL ON FUNCTION public.get_quiz_questions(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_quiz_questions(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.check_quiz_answer(_question_id uuid, _selected_answer integer, _time_taken_ms integer DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _question public.quiz_questions%ROWTYPE;
  _correct boolean;
  _attempt integer;
BEGIN
  IF _user_id IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  SELECT * INTO _question FROM public.quiz_questions WHERE id = _question_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Question not found'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(_user_id::text, 0));
  IF (SELECT count(*) FROM public.user_quiz_performance WHERE user_id = _user_id AND created_at > now() - interval '60 seconds') > 60 THEN
    RAISE EXCEPTION 'Too many attempts, slow down';
  END IF;
  _correct := COALESCE(_selected_answer = _question.correct_answer, false);
  SELECT COALESCE(max(attempt_number), 0) + 1 INTO _attempt FROM public.user_quiz_performance WHERE user_id = _user_id AND question_id = _question_id;
  INSERT INTO public.user_quiz_performance (user_id, question_id, module_id, is_correct, time_taken_ms, attempt_number)
  VALUES (_user_id, _question_id, _question.module_id, _correct, _time_taken_ms, _attempt);
  RETURN jsonb_build_object('is_correct', _correct, 'correct_answer', _question.correct_answer, 'explanation', COALESCE(CASE WHEN _correct THEN _question.explanation_correct ELSE _question.explanation_wrong END, _question.explanation, ''));
END;
$$;
REVOKE ALL ON FUNCTION public.check_quiz_answer(uuid, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_quiz_answer(uuid, integer, integer) TO authenticated;
DROP POLICY IF EXISTS "Users can insert own performance" ON public.user_quiz_performance;
DROP VIEW IF EXISTS public.quiz_questions_public;