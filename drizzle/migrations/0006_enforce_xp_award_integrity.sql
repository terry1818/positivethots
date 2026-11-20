CREATE INDEX IF NOT EXISTS xp_transactions_user_source_id_idx ON public.xp_transactions(user_id, source, source_id);
CREATE INDEX IF NOT EXISTS xp_transactions_user_created_at_idx ON public.xp_transactions(user_id, created_at);
CREATE OR REPLACE FUNCTION public.award_xp(_user_id uuid, _amount integer, _source text, _source_id text DEFAULT NULL::text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  _new_xp integer;
  _new_level integer;
  _current_streak integer;
  _last_activity date;
  _today date := CURRENT_DATE;
  _freeze_used boolean := false;
  _freezes_remaining integer;
  _max integer;
  _awarded integer;
  _duplicate boolean := false;
  _day_start timestamptz := date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
  _daily_xp bigint;
  _old_level integer;
  _scenario_xp integer;
BEGIN
  IF auth.uid() IS NULL OR _user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 1));
  _max := CASE _source
    WHEN 'section_complete' THEN 10 WHEN 'reflection' THEN 5
    WHEN 'quiz_pass' THEN 50 WHEN 'quiz_perfect' THEN 75
    WHEN 'daily_spin' THEN 50 WHEN 'daily_reward' THEN 25
    WHEN 'winback_bonus' THEN 50 WHEN 'streak_restore' THEN 1
    WHEN 'tier_review' THEN 30 WHEN 'scenario' THEN 100
    WHEN 'practice' THEN 5 WHEN 'listen' THEN 5 ELSE NULL END;
  IF _max IS NULL THEN RAISE EXCEPTION 'Invalid XP source'; END IF;
  IF _amount IS NULL OR _amount < 0 THEN RAISE EXCEPTION 'Invalid XP amount'; END IF;
  -- Compatibility: older published clients add 5 XP on their first activity and
  -- send rounded spin multiples (1.5, 2, 2.5, 3). Accept only these known shapes;
  -- the award itself never exceeds the source ceiling or includes invented XP.
  IF _amount > _max AND NOT (
    (_source IN ('section_complete','reflection','quiz_pass','quiz_perfect') AND _amount = _max + 5)
    OR (_source = 'daily_spin' AND _amount IN (55,63,68,75,80,100,105,125,130,150,155))
  ) THEN RAISE EXCEPTION 'Invalid XP amount'; END IF;
  _awarded := LEAST(_amount, _max);
  IF _source IN ('section_complete','reflection') THEN
    IF NOT EXISTS (SELECT 1 FROM public.module_sections WHERE id::text = _source_id) THEN RAISE EXCEPTION 'XP not earned yet'; END IF;
    SELECT EXISTS(SELECT 1 FROM public.xp_transactions WHERE user_id=_user_id AND source=_source AND source_id=_source_id) INTO _duplicate;
  ELSIF _source IN ('quiz_pass','quiz_perfect') THEN
    IF NOT EXISTS (SELECT 1 FROM public.user_badges WHERE user_id=_user_id AND module_id::text=_source_id AND (_source='quiz_pass' OR quiz_score=100)) THEN RAISE EXCEPTION 'XP not earned yet'; END IF;
    SELECT EXISTS(SELECT 1 FROM public.xp_transactions WHERE user_id=_user_id AND source IN ('quiz_pass','quiz_perfect') AND source_id=_source_id) INTO _duplicate;
  ELSIF _source IN ('daily_spin','daily_reward') THEN
    SELECT EXISTS(SELECT 1 FROM public.xp_transactions WHERE user_id=_user_id AND source=_source AND created_at >= _day_start AND created_at < _day_start + interval '1 day') INTO _duplicate;
  ELSIF _source='winback_bonus' THEN
    SELECT EXISTS(SELECT 1 FROM public.xp_transactions WHERE user_id=_user_id AND source=_source AND created_at > now()-interval '30 days') INTO _duplicate;
  ELSIF _source='streak_restore' THEN
    SELECT count(*) >= 3 INTO _duplicate FROM public.xp_transactions WHERE user_id=_user_id AND source=_source AND created_at >= _day_start AND created_at < _day_start + interval '1 day';
  ELSE
    IF NULLIF(btrim(_source_id),'') IS NULL THEN RAISE EXCEPTION 'XP not earned yet'; END IF;
    IF _source='scenario' THEN
      SELECT xp_reward INTO _scenario_xp FROM public.education_scenarios WHERE id::text=_source_id;
      IF NOT FOUND THEN RAISE EXCEPTION 'XP not earned yet'; END IF;
      IF _amount IS DISTINCT FROM _scenario_xp THEN RAISE EXCEPTION 'Invalid XP amount'; END IF;
    END IF;
    SELECT EXISTS(SELECT 1 FROM public.xp_transactions WHERE user_id=_user_id AND source=_source AND source_id=_source_id) INTO _duplicate;
  END IF;
  SELECT total_xp,current_level,current_streak,last_activity_date,streak_freezes
    INTO _new_xp,_old_level,_current_streak,_last_activity,_freezes_remaining
    FROM public.user_learning_stats WHERE user_id=_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'XP not earned yet'; END IF;
  SELECT COALESCE(sum(xp_amount),0) INTO _daily_xp FROM public.xp_transactions
    WHERE user_id=_user_id AND created_at >= _day_start AND created_at < _day_start + interval '1 day';
  IF _duplicate OR _daily_xp + _awarded > 400 OR _awarded=0 THEN
    RETURN jsonb_build_object('new_xp',_new_xp,'new_level',_old_level,'new_streak',_current_streak,'freeze_used',false,'freezes_remaining',_freezes_remaining,'awarded',0,'leveledUp',false,'leveled_up',false);
  END IF;
  INSERT INTO public.xp_transactions(user_id,xp_amount,source,source_id) VALUES(_user_id,_awarded,_source,_source_id);
  _new_xp := _new_xp + _awarded;
  _new_level := public.level_for_xp(_new_xp);
  IF _last_activity IS NULL OR _last_activity < _today - 1 THEN
    IF _last_activity = _today - 2 AND _freezes_remaining > 0 AND _current_streak > 0 THEN
      _freeze_used := true;
      _freezes_remaining := _freezes_remaining - 1;
      _current_streak := _current_streak + 1;
    ELSE _current_streak := 1; END IF;
  ELSIF _last_activity = _today - 1 THEN _current_streak := _current_streak + 1; END IF;
  UPDATE public.user_learning_stats SET total_xp=_new_xp,current_level=_new_level,current_streak=_current_streak,longest_streak=GREATEST(longest_streak,_current_streak),last_activity_date=_today,updated_at=now(),streak_freezes=_freezes_remaining,streak_freeze_used_at=CASE WHEN _freeze_used THEN now() ELSE streak_freeze_used_at END WHERE user_id=_user_id;
  RETURN jsonb_build_object('new_xp',_new_xp,'new_level',_new_level,'new_streak',_current_streak,'freeze_used',_freeze_used,'freezes_remaining',_freezes_remaining,'awarded',_awarded,'leveledUp',_new_level > _old_level,'leveled_up',_new_level > _old_level);
END;
$function$;