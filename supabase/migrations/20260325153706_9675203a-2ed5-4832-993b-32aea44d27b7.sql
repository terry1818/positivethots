
CREATE OR REPLACE FUNCTION public.get_success_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _result jsonb;
  _day7_retention numeric;
  _sessions_per_dau numeric;
  _module_completion numeric;
  _foundation_completion numeric;
  _quiz_pass_rate numeric;
  _streak_7day_rate numeric;
  _reflection_rate numeric;
  _cohort_size bigint;
  _retained bigint;
  _active_users bigint;
  _total_sessions bigint;
  _started bigint;
  _completed bigint;
  _total_registered bigint;
  _foundation_complete_users bigint;
  _quiz_passes bigint;
  _quiz_total bigint;
  _streak_users bigint;
  _active_learners bigint;
  _reflections_submitted bigint;
  _reflectable_completions bigint;
BEGIN
  -- Day-7 retention: users who signed up 7-14 days ago and had activity in last 7 days
  SELECT count(DISTINCT p.id) INTO _cohort_size
  FROM profiles p
  WHERE p.created_at >= now() - interval '14 days'
    AND p.created_at < now() - interval '7 days';

  SELECT count(DISTINCT p.id) INTO _retained
  FROM profiles p
  WHERE p.created_at >= now() - interval '14 days'
    AND p.created_at < now() - interval '7 days'
    AND EXISTS (
      SELECT 1 FROM analytics_events ae
      WHERE ae.user_id = p.id
        AND ae.created_at >= now() - interval '7 days'
    );

  _day7_retention := CASE WHEN _cohort_size > 0 THEN round((_retained::numeric / _cohort_size) * 100, 1) ELSE 0 END;

  -- Sessions per DAU: distinct (user, date) pairs with events / distinct active users, last 7 days
  SELECT count(DISTINCT user_id) INTO _active_users
  FROM analytics_events
  WHERE created_at >= now() - interval '7 days'
    AND user_id IS NOT NULL;

  SELECT count(*) INTO _total_sessions
  FROM (
    SELECT user_id, created_at::date AS d
    FROM analytics_events
    WHERE created_at >= now() - interval '7 days'
      AND user_id IS NOT NULL
    GROUP BY user_id, created_at::date
  ) sub;

  _sessions_per_dau := CASE WHEN _active_users > 0 THEN round(_total_sessions::numeric / _active_users, 1) ELSE 0 END;

  -- Module completion rate: users who earned badge / users who started (have section progress)
  SELECT count(DISTINCT (usp.user_id, ms.module_id)) INTO _started
  FROM user_section_progress usp
  JOIN module_sections ms ON ms.id = usp.section_id;

  SELECT count(DISTINCT (ub.user_id, ub.module_id)) INTO _completed
  FROM user_badges ub;

  _module_completion := CASE WHEN _started > 0 THEN round((_completed::numeric / _started) * 100, 1) ELSE 0 END;

  -- Foundation completion: users with 5+ foundation badges / total registered
  SELECT count(*) INTO _total_registered FROM profiles;

  SELECT count(*) INTO _foundation_complete_users
  FROM (
    SELECT ub.user_id
    FROM user_badges ub
    JOIN education_modules em ON em.id = ub.module_id
    WHERE em.tier = 'foundation'
    GROUP BY ub.user_id
    HAVING count(DISTINCT ub.module_id) >= 5
  ) sub;

  _foundation_completion := CASE WHEN _total_registered > 0 THEN round((_foundation_complete_users::numeric / _total_registered) * 100, 1) ELSE 0 END;

  -- Quiz pass rate: xp_transactions with quiz_pass or quiz_perfect / all quiz sources
  SELECT count(*) INTO _quiz_passes
  FROM xp_transactions WHERE source IN ('quiz_pass', 'quiz_perfect');

  SELECT count(*) INTO _quiz_total
  FROM xp_transactions WHERE source IN ('quiz_pass', 'quiz_perfect', 'quiz_fail', 'quiz_completion');

  _quiz_pass_rate := CASE WHEN _quiz_total > 0 THEN round((_quiz_passes::numeric / _quiz_total) * 100, 1) ELSE 0 END;

  -- Streak 7-day rate: users with streak >= 7 / active learners (last 14 days)
  SELECT count(*) INTO _streak_users
  FROM user_learning_stats WHERE current_streak >= 7;

  SELECT count(*) INTO _active_learners
  FROM user_learning_stats WHERE last_activity_date >= (current_date - 14);

  _streak_7day_rate := CASE WHEN _active_learners > 0 THEN round((_streak_users::numeric / _active_learners) * 100, 1) ELSE 0 END;

  -- Reflection completion rate: sections with reflections that got a reflection / total completions of reflectable sections
  SELECT count(DISTINCT (ur.user_id, ur.section_id)) INTO _reflections_submitted
  FROM user_reflections ur;

  SELECT count(DISTINCT (usp.user_id, usp.section_id)) INTO _reflectable_completions
  FROM user_section_progress usp
  JOIN module_sections ms ON ms.id = usp.section_id
  WHERE usp.completed = true
    AND ms.reflection_prompt IS NOT NULL;

  _reflection_rate := CASE WHEN _reflectable_completions > 0 THEN round((_reflections_submitted::numeric / _reflectable_completions) * 100, 1) ELSE 0 END;

  _result := jsonb_build_object(
    'day7_retention', _day7_retention,
    'sessions_per_dau', _sessions_per_dau,
    'module_completion', _module_completion,
    'foundation_completion', _foundation_completion,
    'quiz_pass_rate', _quiz_pass_rate,
    'streak_7day_rate', _streak_7day_rate,
    'reflection_rate', _reflection_rate
  );

  RETURN _result;
END;
$function$;
