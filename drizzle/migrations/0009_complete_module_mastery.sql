CREATE OR REPLACE FUNCTION public.complete_module_mastery(_module_id uuid, _session_started_at timestamptz)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _user_id uuid := auth.uid();
  _total integer;
  _correct integer;
  _score integer;
  _remaining uuid[];
BEGIN
  IF _user_id IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  IF _session_started_at IS NULL OR _session_started_at > now() OR _session_started_at < now() - interval '3 hours' THEN
    RAISE EXCEPTION 'Invalid session start';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(_user_id::text || ':' || _module_id::text, 7));
  SELECT count(*) INTO _total FROM public.quiz_questions WHERE module_id = _module_id AND NOT COALESCE(is_checkpoint, false);
  IF _total = 0 THEN RAISE EXCEPTION 'No quiz questions found for this module'; END IF;
  SELECT array_agg(q.id ORDER BY q.order_index, q.id) INTO _remaining
  FROM public.quiz_questions q WHERE q.module_id = _module_id AND NOT COALESCE(q.is_checkpoint, false)
    AND NOT EXISTS (SELECT 1 FROM public.user_quiz_performance p WHERE p.user_id = _user_id AND p.question_id = q.id AND p.is_correct AND p.created_at >= _session_started_at);
  IF COALESCE(cardinality(_remaining), 0) > 0 THEN
    RETURN jsonb_build_object('passed', false, 'remaining', to_jsonb(_remaining));
  END IF;
  SELECT count(*) INTO _correct FROM public.quiz_questions q
  CROSS JOIN LATERAL (
    SELECT p.is_correct FROM public.user_quiz_performance p
    WHERE p.user_id = _user_id AND p.question_id = q.id AND p.created_at >= _session_started_at
    ORDER BY p.created_at, p.attempt_number, p.id LIMIT 1
  ) first_attempt
  WHERE q.module_id = _module_id AND NOT COALESCE(q.is_checkpoint, false) AND first_attempt.is_correct;
  _score := round(100.0 * _correct / _total);
  INSERT INTO public.user_badges (user_id, module_id, quiz_score, attempt_count, last_attempt_at)
  VALUES (_user_id, _module_id, _score, 1, now())
  ON CONFLICT (user_id, module_id) DO UPDATE SET
    quiz_score = GREATEST(user_badges.quiz_score, EXCLUDED.quiz_score),
    attempt_count = user_badges.attempt_count + 1,
    last_attempt_at = now();
  RETURN jsonb_build_object('passed', true, 'score', _score, 'first_try_correct', _correct, 'total', _total);
END;
$$;
REVOKE ALL ON FUNCTION public.complete_module_mastery(uuid, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_module_mastery(uuid, timestamptz) TO authenticated, service_role;