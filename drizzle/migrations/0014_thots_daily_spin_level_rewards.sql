-- Thots that last, a Thot allowance decided by the server, and a daily spin the server runs.
--
-- 1. Thots. super_like_balance.balance used to hold everything, and the daily refresh overwrote it
--    with the plan's limit, so Thots earned from streaks, levels, packs or prizes vanished the next
--    day. Now `daily_remaining` is today's allowance (reset each day) and `balance` is the bank of
--    earned or bought Thots, which nothing resets. The allowance comes from the member's plan on the
--    server (free 1, Plus and Premium 5, VIP unlimited), not from a number the app sends.
-- 2. Sending a Thot is one server call that spends a Thot and records it together, so a Thot cannot
--    be sent without being paid for, and a balance row cannot be created with an invented number.
-- 3. The daily spin is picked and granted by the server: XP, a Thot, or a streak freeze.

-- ── 1. Thot balance ─────────────────────────────────────────────────────────
ALTER TABLE public.super_like_balance
  ADD COLUMN IF NOT EXISTS daily_remaining integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.super_like_balance.balance IS 'Earned or bought Thots. Never reset.';
COMMENT ON COLUMN public.super_like_balance.daily_remaining IS 'What is left of today''s free Thots. Reset each day by refresh_daily_super_likes.';

-- Daily Thots for a member's plan. 999 means unlimited.
CREATE OR REPLACE FUNCTION public.thot_daily_limit(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE((
    SELECT CASE s.plan WHEN 'vip' THEN 999 WHEN 'premium' THEN 5 WHEN 'plus' THEN 5 ELSE 1 END
    FROM public.subscriptions s
    WHERE s.user_id = _user_id
      AND s.status = 'active'
      AND (s.current_period_end IS NULL OR s.current_period_end > now())
    ORDER BY CASE s.plan WHEN 'vip' THEN 3 WHEN 'premium' THEN 2 WHEN 'plus' THEN 1 ELSE 0 END DESC
    LIMIT 1
  ), 1);
$$;
REVOKE ALL ON FUNCTION public.thot_daily_limit(uuid) FROM PUBLIC, anon, authenticated;

-- Same name and arguments as before so app versions already installed keep working.
-- _daily_limit is ignored: the limit comes from the member's plan.
CREATE OR REPLACE FUNCTION public.refresh_daily_super_likes(_user_id uuid, _daily_limit integer DEFAULT 5)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _limit integer;
  _total integer;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  _limit := public.thot_daily_limit(_user_id);
  IF _limit >= 999 THEN
    RETURN 999;
  END IF;

  INSERT INTO public.super_like_balance (user_id, balance, daily_remaining, last_daily_refresh, updated_at)
  VALUES (_user_id, 0, _limit, CURRENT_DATE, now())
  ON CONFLICT (user_id) DO UPDATE
  SET daily_remaining = CASE
        WHEN super_like_balance.last_daily_refresh IS NULL OR super_like_balance.last_daily_refresh < CURRENT_DATE
          THEN EXCLUDED.daily_remaining
        ELSE super_like_balance.daily_remaining
      END,
      last_daily_refresh = CURRENT_DATE,
      updated_at = now()
  RETURNING daily_remaining + balance INTO _total;

  RETURN _total;
END;
$function$;

-- Spends today's free Thots first, then banked ones. Returns how many are left.
CREATE OR REPLACE FUNCTION public.decrement_super_like(_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _total integer;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF public.thot_daily_limit(_user_id) >= 999 THEN
    RETURN 999;
  END IF;

  UPDATE public.super_like_balance
  SET daily_remaining = CASE WHEN daily_remaining > 0 THEN daily_remaining - 1 ELSE daily_remaining END,
      balance = CASE WHEN daily_remaining > 0 THEN balance ELSE balance - 1 END,
      updated_at = now()
  WHERE user_id = _user_id AND (daily_remaining > 0 OR balance > 0)
  RETURNING daily_remaining + balance INTO _total;

  IF _total IS NULL THEN
    RAISE EXCEPTION 'No super likes remaining';
  END IF;

  RETURN _total;
END;
$function$;

-- Send a Thot: spend one and record it, or do neither. Returns how many are left (999 = unlimited).
CREATE OR REPLACE FUNCTION public.send_thot(_receiver_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _remaining integer;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF _receiver_id IS NULL OR _receiver_id = _uid
     OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = _receiver_id) THEN
    RAISE EXCEPTION 'Invalid receiver';
  END IF;

  PERFORM public.refresh_daily_super_likes(_uid, 0);  -- make sure today's allowance is in place
  _remaining := public.decrement_super_like(_uid);    -- raises when there is nothing to spend

  INSERT INTO public.super_likes (sender_id, receiver_id) VALUES (_uid, _receiver_id);
  RETURN _remaining;
END;
$function$;
REVOKE ALL ON FUNCTION public.send_thot(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_thot(uuid) TO authenticated, service_role;

-- Only the functions above write these tables now.
DROP POLICY IF EXISTS "Users can insert own balance" ON public.super_like_balance;
DROP POLICY IF EXISTS "Users can insert own super likes" ON public.super_likes;

-- ── 2. Daily spin ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.daily_spins (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  spin_date date NOT NULL,
  prize_index integer NOT NULL,
  prize_type text NOT NULL,
  prize_value integer NOT NULL,
  xp_awarded integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, spin_date)
);
ALTER TABLE public.daily_spins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own spins" ON public.daily_spins;
CREATE POLICY "Users can read own spins" ON public.daily_spins
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- One spin per UTC day. The server picks the prize and grants it in the same step.
-- Wedges, in the order the wheel draws them (src/lib/spinWheel.ts):
--   0 +5 XP   1 +10 XP   2 +5 XP          common     60%
--   3 +25 XP  4 +15 XP                    uncommon   25%
--   5 +50 XP  6 +1 Thot                   rare       12%
--   7 Streak Freeze                       very rare   3%
CREATE OR REPLACE FUNCTION public.claim_daily_spin()
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
  _xp jsonb;
  _awarded integer := 0;
  _max_freezes constant integer := 3;
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
  SELECT streak_freezes INTO _freezes FROM public.user_learning_stats WHERE user_id = _uid;

  IF _roll < 60 THEN
    _index := (ARRAY[0, 1, 2])[1 + floor(_pick * 3)::int];
  ELSIF _roll < 85 THEN
    _index := (ARRAY[3, 4])[1 + floor(_pick * 2)::int];
  ELSIF _roll < 97 THEN
    _index := (ARRAY[5, 6])[1 + floor(_pick * 2)::int];
  ELSE
    _index := 7;
  END IF;

  -- Never hand out a prize that would be worth nothing to this member.
  IF _index = 7 AND COALESCE(_freezes, 0) >= _max_freezes THEN _index := 5; END IF;  -- freezes are full
  IF _index = 6 AND public.thot_daily_limit(_uid) >= 999 THEN _index := 5; END IF;   -- Thots are unlimited

  _type := CASE _index WHEN 6 THEN 'thot' WHEN 7 THEN 'freeze' ELSE 'xp' END;
  _value := (ARRAY[5, 10, 5, 25, 15, 50, 1, 1])[_index + 1];

  IF _type = 'xp' THEN
    _xp := public.award_xp(_uid, _value, 'daily_spin', NULL);
    _awarded := COALESCE((_xp ->> 'awarded')::integer, 0);
  ELSIF _type = 'thot' THEN
    INSERT INTO public.super_like_balance (user_id, balance, daily_remaining, updated_at)
    VALUES (_uid, 1, 0, now())
    ON CONFLICT (user_id) DO UPDATE SET balance = super_like_balance.balance + 1, updated_at = now();
  ELSE
    UPDATE public.user_learning_stats
    SET streak_freezes = LEAST(COALESCE(streak_freezes, 0) + 1, _max_freezes), updated_at = now()
    WHERE user_id = _uid;
  END IF;

  INSERT INTO public.daily_spins (user_id, spin_date, prize_index, prize_type, prize_value, xp_awarded)
  VALUES (_uid, _today, _index, _type, _value, _awarded);
  UPDATE public.profiles SET last_daily_spin = _today WHERE id = _uid;

  -- An XP prize that added nothing means today's XP limit was already reached. The spin still counts.
  IF _type = 'xp' AND _awarded = 0 THEN
    RETURN jsonb_build_object('status', 'capped', 'index', _index);
  END IF;

  RETURN jsonb_build_object('status', 'won', 'index', _index, 'type', _type, 'value', _value,
                            'awarded', _awarded, 'xp', _xp);
END;
$function$;
REVOKE ALL ON FUNCTION public.claim_daily_spin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_daily_spin() TO authenticated, service_role;

-- ── 3. Level rewards that actually land ─────────────────────────────────────
-- Level 10 grants a Profile Boost credit (user_learning_stats.boost_credits) but nothing could spend
-- it. This spends one and starts a boost.
CREATE OR REPLACE FUNCTION public.use_boost_credit()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _left integer;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF EXISTS (SELECT 1 FROM public.profile_boosts WHERE user_id = _uid AND expires_at > now()) THEN
    RAISE EXCEPTION 'Boost already active';
  END IF;

  UPDATE public.user_learning_stats
  SET boost_credits = boost_credits - 1, updated_at = now()
  WHERE user_id = _uid AND COALESCE(boost_credits, 0) > 0
  RETURNING boost_credits INTO _left;

  IF _left IS NULL THEN
    RAISE EXCEPTION 'No boost credits';
  END IF;

  INSERT INTO public.profile_boosts (user_id) VALUES (_uid);
  RETURN _left;
END;
$function$;
REVOKE ALL ON FUNCTION public.use_boost_credit() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.use_boost_credit() TO authenticated, service_role;

-- Level 5 promised a streak freeze but only set a flag nothing reads. Give the freeze to members
-- who already reached level 5, once (the marker row makes this safe to run again).
WITH owed AS (
  SELECT DISTINCT t.user_id
  FROM public.xp_transactions t
  WHERE t.source = 'level_reward_5'
    AND NOT EXISTS (SELECT 1 FROM public.xp_transactions d
                    WHERE d.user_id = t.user_id AND d.source = 'level_reward_5_freeze')
), marked AS (
  INSERT INTO public.xp_transactions (user_id, xp_amount, source, source_id)
  SELECT user_id, 0, 'level_reward_5_freeze', 'level_5' FROM owed
  RETURNING user_id
)
UPDATE public.user_learning_stats s
SET streak_freezes = LEAST(COALESCE(s.streak_freezes, 0) + 1, 3), updated_at = now()
FROM marked m
WHERE s.user_id = m.user_id;