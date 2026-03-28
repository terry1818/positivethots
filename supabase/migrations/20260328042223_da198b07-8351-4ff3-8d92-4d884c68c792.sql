
-- Add streak freeze columns to user_learning_stats
ALTER TABLE public.user_learning_stats 
  ADD COLUMN IF NOT EXISTS streak_freezes integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS streak_freeze_used_at timestamptz;

-- Update award_xp function to auto-use streak freeze when streak would break
CREATE OR REPLACE FUNCTION public.award_xp(_user_id uuid, _amount integer, _source text, _source_id text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _new_xp integer;
  _new_level integer;
  _current_streak integer;
  _last_activity date;
  _today date := CURRENT_DATE;
  _freeze_used boolean := false;
  _freezes_remaining integer;
BEGIN
  IF auth.uid() != _user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF _amount < 0 OR _amount > 200 THEN
    RAISE EXCEPTION 'Invalid XP amount';
  END IF;

  INSERT INTO public.xp_transactions (user_id, xp_amount, source, source_id)
  VALUES (_user_id, _amount, _source, _source_id);

  SELECT total_xp + _amount, current_streak, last_activity_date, streak_freezes
  INTO _new_xp, _current_streak, _last_activity, _freezes_remaining
  FROM public.user_learning_stats
  WHERE user_id = _user_id;

  _new_level := GREATEST(1, (_new_xp / 500) + 1);

  -- Update streak with freeze logic
  IF _last_activity IS NULL OR _last_activity < _today - 1 THEN
    -- Missed more than 1 day
    IF _last_activity = _today - 2 AND _freezes_remaining > 0 AND _current_streak > 0 THEN
      -- Only missed yesterday, use a freeze
      _freeze_used := true;
      _freezes_remaining := _freezes_remaining - 1;
      _current_streak := _current_streak + 1;
    ELSE
      _current_streak := 1;
    END IF;
  ELSIF _last_activity = _today - 1 THEN
    _current_streak := _current_streak + 1;
  END IF;
  -- If _last_activity = _today, streak stays the same

  UPDATE public.user_learning_stats
  SET total_xp = _new_xp,
      current_level = _new_level,
      current_streak = _current_streak,
      longest_streak = GREATEST(longest_streak, _current_streak),
      last_activity_date = _today,
      updated_at = now(),
      streak_freezes = _freezes_remaining,
      streak_freeze_used_at = CASE WHEN _freeze_used THEN now() ELSE streak_freeze_used_at END
  WHERE user_id = _user_id;

  RETURN jsonb_build_object(
    'new_xp', _new_xp,
    'new_level', _new_level,
    'new_streak', _current_streak,
    'freeze_used', _freeze_used,
    'freezes_remaining', _freezes_remaining
  );
END;
$function$;
