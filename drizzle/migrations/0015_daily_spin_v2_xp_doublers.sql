-- More prizes on the daily spin, each one really granted:
--   a Profile Boost, double XP on the next lesson, a profile frame only the wheel gives,
--   an extra Mystery Match reveal, and a streak bonus that multiplies XP prizes.

-- A "2x XP" token: the next lesson finished pays twice. Held until used, at most 3.
ALTER TABLE public.user_learning_stats
  ADD COLUMN IF NOT EXISTS xp_doublers integer NOT NULL DEFAULT 0;

-- Mystery Match reveals on top of the day's allowance. Held until used, at most 5.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bonus_mystery_reveals integer NOT NULL DEFAULT 0;

-- One spin per UTC day. The server picks the prize and grants it in the same step.
-- Wedges, in the order the wheel draws them (src/lib/spinWheel.ts):
--    0 +5 XP        1 2x XP token     2 +10 XP        3 +1 Thot
--    4 +25 XP       5 Lucky Spin frame 6 +5 XP        7 Mystery Match reveal
--    8 +15 XP       9 Streak Freeze   10 +50 XP      11 Profile Boost
-- Tiers: common 54% (0, 2, 6, 8), uncommon 28% (1, 4, 7), rare 13% (3, 9, 10), very rare 5% (5, 11).
-- XP prizes are multiplied by the member's streak: 3 days 1.5x, 7 days 2x, 14 days 2.5x, 30 days 3x.
-- This is a new function, not a replacement. claim_daily_spin() (8 wedges) stays as it is, so a
-- copy of the app published before this change keeps showing the prize it really gives. The two
-- share daily_spins, so a member still gets one spin a day whichever one their app calls.
-- claim_daily_spin() can be dropped once no published app calls it.
CREATE OR REPLACE FUNCTION public.claim_daily_spin_v2()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _today date := (now() AT TIME ZONE 'UTC')::date;
  _day_start timestamptz := date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
  _roll double precision := random() * 100;
  _pick double precision := random();
  _index integer;
  _type text;
  _value integer;
  _freezes integer;
  _doublers integer;
  _credits integer;
  _reveals integer;
  _has_frame boolean;
  _xp jsonb;
  _awarded integer := 0;
  _streak integer := 0;
  _mult numeric := 1;
  _bonus integer := 0;
  _daily bigint;
  _new_xp integer;
  _new_level integer;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(_uid::text, 2));

  -- Already spun today, here or through an older app version that awarded spin XP directly.
  IF EXISTS (SELECT 1 FROM public.daily_spins WHERE user_id = _uid AND spin_date = _today)
     OR EXISTS (SELECT 1 FROM public.xp_transactions
                WHERE user_id = _uid AND source = 'daily_spin'
                  AND created_at >= _day_start AND created_at < _day_start + interval '1 day') THEN
    RETURN jsonb_build_object('status', 'used');
  END IF;

  INSERT INTO public.user_learning_stats (user_id) VALUES (_uid) ON CONFLICT (user_id) DO NOTHING;
  SELECT COALESCE(streak_freezes, 0), COALESCE(xp_doublers, 0), COALESCE(boost_credits, 0)
    INTO _freezes, _doublers, _credits
    FROM public.user_learning_stats WHERE user_id = _uid;
  SELECT COALESCE(bonus_mystery_reveals, 0), 'lucky_spin' = ANY(COALESCE(earned_frames, '{}'))
    INTO _reveals, _has_frame
    FROM public.profiles WHERE id = _uid;

  IF _roll < 54 THEN
    _index := (ARRAY[0, 2, 6, 8])[1 + floor(_pick * 4)::int];
  ELSIF _roll < 82 THEN
    _index := (ARRAY[1, 4, 7])[1 + floor(_pick * 3)::int];
  ELSIF _roll < 95 THEN
    _index := (ARRAY[3, 9, 10])[1 + floor(_pick * 3)::int];
  ELSE
    _index := (ARRAY[5, 11])[1 + floor(_pick * 2)::int];
  END IF;

  -- Never hand out a prize that would be worth nothing to this member: give XP of the same tier instead.
  IF _index = 1 AND _doublers >= 3 THEN _index := 4; END IF;                         -- already holds 3 doublers
  IF _index = 7 AND COALESCE(_reveals, 0) >= 5 THEN _index := 4; END IF;             -- already holds 5 reveals
  IF _index = 3 AND public.thot_daily_limit(_uid) >= 999 THEN _index := 10; END IF;  -- Thots are unlimited
  IF _index = 9 AND _freezes >= 3 THEN _index := 10; END IF;                         -- freezes are full
  IF _index = 5 AND COALESCE(_has_frame, false) THEN _index := 10; END IF;           -- frame already won
  IF _index = 11 AND _credits >= 3 THEN _index := 10; END IF;                        -- already holds 3 boosts

  _type := (ARRAY['xp', 'doubler', 'xp', 'thot', 'xp', 'frame', 'xp', 'reveal', 'xp', 'freeze', 'xp', 'boost'])[_index + 1];
  _value := (ARRAY[5, 1, 10, 1, 25, 1, 5, 1, 15, 1, 50, 1])[_index + 1];

  IF _type = 'xp' THEN
    _xp := public.award_xp(_uid, _value, 'daily_spin', NULL);
    _awarded := COALESCE((_xp ->> 'awarded')::integer, 0);
    IF _awarded > 0 THEN
      -- Streak bonus: the longer the streak, the more an XP prize is worth.
      _streak := COALESCE((_xp ->> 'new_streak')::integer, 0);
      _mult := CASE WHEN _streak >= 30 THEN 3 WHEN _streak >= 14 THEN 2.5 WHEN _streak >= 7 THEN 2 WHEN _streak >= 3 THEN 1.5 ELSE 1 END;
      _bonus := round(_awarded * _mult)::integer - _awarded;
      IF _bonus > 0 THEN
        -- The bonus respects the same 400 XP a day limit as everything else.
        SELECT COALESCE(sum(xp_amount), 0) INTO _daily FROM public.xp_transactions
          WHERE user_id = _uid AND created_at >= _day_start AND created_at < _day_start + interval '1 day';
        _bonus := LEAST(_bonus, GREATEST(0, 400 - _daily)::integer);
      END IF;
      IF _bonus > 0 THEN
        INSERT INTO public.xp_transactions (user_id, xp_amount, source, source_id)
        VALUES (_uid, _bonus, 'daily_spin_bonus', 'streak_' || _streak);
        UPDATE public.user_learning_stats
        SET total_xp = total_xp + _bonus, current_level = public.level_for_xp(total_xp + _bonus), updated_at = now()
        WHERE user_id = _uid
        RETURNING total_xp, current_level INTO _new_xp, _new_level;
        _xp := _xp || jsonb_build_object('new_xp', _new_xp, 'new_level', _new_level, 'awarded', _awarded + _bonus);
        _awarded := _awarded + _bonus;
      ELSE
        _mult := 1;
      END IF;
    END IF;
  ELSIF _type = 'thot' THEN
    INSERT INTO public.super_like_balance (user_id, balance, daily_remaining, updated_at)
    VALUES (_uid, 1, 0, now())
    ON CONFLICT (user_id) DO UPDATE SET balance = super_like_balance.balance + 1, updated_at = now();
  ELSIF _type = 'freeze' THEN
    UPDATE public.user_learning_stats SET streak_freezes = LEAST(COALESCE(streak_freezes, 0) + 1, 3), updated_at = now() WHERE user_id = _uid;
  ELSIF _type = 'doubler' THEN
    UPDATE public.user_learning_stats SET xp_doublers = LEAST(COALESCE(xp_doublers, 0) + 1, 3), updated_at = now() WHERE user_id = _uid;
  ELSIF _type = 'boost' THEN
    UPDATE public.user_learning_stats SET boost_credits = LEAST(COALESCE(boost_credits, 0) + 1, 3), updated_at = now() WHERE user_id = _uid;
  ELSIF _type = 'reveal' THEN
    UPDATE public.profiles SET bonus_mystery_reveals = LEAST(COALESCE(bonus_mystery_reveals, 0) + 1, 5) WHERE id = _uid;
  ELSIF _type = 'frame' THEN
    UPDATE public.profiles SET earned_frames = array_append(COALESCE(earned_frames, ARRAY['newbie']), 'lucky_spin') WHERE id = _uid;
  END IF;

  INSERT INTO public.daily_spins (user_id, spin_date, prize_index, prize_type, prize_value, xp_awarded)
  VALUES (_uid, _today, _index, _type, _value, _awarded);
  UPDATE public.profiles SET last_daily_spin = _today WHERE id = _uid;

  -- An XP prize that added nothing means today's XP limit was already reached. The spin still counts.
  IF _type = 'xp' AND _awarded = 0 THEN
    RETURN jsonb_build_object('status', 'capped', 'index', _index);
  END IF;

  RETURN jsonb_build_object('status', 'won', 'index', _index, 'type', _type, 'value', _value,
                            'awarded', _awarded, 'xp', _xp, 'bonus', _bonus, 'multiplier', _mult);
END;
$function$;
REVOKE ALL ON FUNCTION public.claim_daily_spin_v2() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_daily_spin_v2() TO authenticated, service_role;

-- Spend a "2x XP" token on a lesson finished today: pays that lesson's XP a second time.
-- Called by the app right after the lesson's own XP is awarded. Safe to call when there is nothing to double.
CREATE OR REPLACE FUNCTION public.use_xp_doubler(_section_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _day_start timestamptz := date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
  _base integer;
  _daily bigint;
  _bonus integer;
  _left integer;
  _new_xp integer;
  _new_level integer;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(_uid::text, 1));  -- the same lock award_xp takes

  SELECT xp_amount INTO _base FROM public.xp_transactions
    WHERE user_id = _uid AND source = 'section_complete' AND source_id = _section_id AND created_at >= _day_start
    ORDER BY created_at DESC LIMIT 1;
  IF _base IS NULL OR _base <= 0
     OR EXISTS (SELECT 1 FROM public.xp_transactions WHERE user_id = _uid AND source = 'xp_doubler' AND source_id = _section_id) THEN
    RETURN jsonb_build_object('status', 'none');
  END IF;

  SELECT COALESCE(sum(xp_amount), 0) INTO _daily FROM public.xp_transactions
    WHERE user_id = _uid AND created_at >= _day_start AND created_at < _day_start + interval '1 day';
  _bonus := LEAST(_base, GREATEST(0, 400 - _daily)::integer);
  IF _bonus <= 0 THEN
    RETURN jsonb_build_object('status', 'none');  -- at the daily limit: keep the token for another day
  END IF;

  UPDATE public.user_learning_stats SET xp_doublers = xp_doublers - 1, updated_at = now()
    WHERE user_id = _uid AND COALESCE(xp_doublers, 0) > 0
    RETURNING xp_doublers INTO _left;
  IF _left IS NULL THEN
    RETURN jsonb_build_object('status', 'none');
  END IF;

  INSERT INTO public.xp_transactions (user_id, xp_amount, source, source_id)
  VALUES (_uid, _bonus, 'xp_doubler', _section_id);
  UPDATE public.user_learning_stats
  SET total_xp = total_xp + _bonus, current_level = public.level_for_xp(total_xp + _bonus), updated_at = now()
  WHERE user_id = _uid
  RETURNING total_xp, current_level INTO _new_xp, _new_level;

  RETURN jsonb_build_object('status', 'doubled', 'bonus', _bonus, 'new_xp', _new_xp, 'new_level', _new_level, 'doublers_left', _left);
END;
$function$;
REVOKE ALL ON FUNCTION public.use_xp_doubler(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.use_xp_doubler(text) TO authenticated, service_role;
