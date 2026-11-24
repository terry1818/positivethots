-- 1. Coins: only the server may add or remove coins. Members could call these for any account.
REVOKE EXECUTE ON FUNCTION public.credit_coins(uuid, integer, text, text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.debit_coins(uuid, integer, text, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_coins(uuid, integer, text, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.debit_coins(uuid, integer, text, text, uuid) TO service_role;
DROP POLICY IF EXISTS "Users insert own transactions" ON public.thots_coins_transactions;

-- 2. Gift and promo codes: members can no longer create codes. Codes are created by the server only.
DROP POLICY IF EXISTS "Users can insert own codes" ON public.promo_codes;

-- 3. Store wording (hidden while coins are off, corrected so it is right when they return).
UPDATE public.thots_coins_store SET description = 'Tell someone they stand out' WHERE item_type = 'send_thot';
UPDATE public.thots_coins_store SET description = 'Near the front of Discover for 24 hours' WHERE item_type = 'boost';
UPDATE public.thots_coins_store SET description = 'A special glow on your partner constellation' WHERE item_type = 'constellation_glow';

-- 4. Plan perks other members can see the effect of: who is shown sooner, who carries the Mentor badge.
-- Returns flags only, never the plan itself.
CREATE OR REPLACE FUNCTION public.get_plan_perks(_ids uuid[])
RETURNS TABLE (user_id uuid, priority boolean, mentor boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.user_id, bool_or(s.plan IN ('premium', 'vip')), bool_or(s.plan = 'vip')
  FROM public.subscriptions s
  WHERE auth.uid() IS NOT NULL
    AND s.user_id = ANY (_ids[1:200])
    AND s.status = 'active'
    AND (s.current_period_end IS NULL OR s.current_period_end > now())
  GROUP BY s.user_id;
$$;
REVOKE EXECUTE ON FUNCTION public.get_plan_perks(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_plan_perks(uuid[]) TO authenticated;

-- 5. Weekly sprint, community goal and daily challenge are all counted by the server from the XP
-- ledger (xp_transactions), which only the server writes. Nothing here trusts a number sent by a phone.
ALTER TABLE public.sprint_participants ADD COLUMN IF NOT EXISTS tier_reached integer NOT NULL DEFAULT 0;
ALTER TABLE public.daily_challenges ADD COLUMN IF NOT EXISTS reward_kind text;
DROP POLICY IF EXISTS "Users can join sprints" ON public.sprint_participants;
DROP POLICY IF EXISTS "Users can update own sprint data" ON public.sprint_participants;

CREATE TABLE IF NOT EXISTS public.community_challenge_contributions (
  challenge_id uuid NOT NULL REFERENCES public.community_challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  amount integer NOT NULL DEFAULT 0,
  rewarded boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (challenge_id, user_id)
);
ALTER TABLE public.community_challenge_contributions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members see their own contribution" ON public.community_challenge_contributions;
CREATE POLICY "Members see their own contribution" ON public.community_challenge_contributions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.ensure_weekly_sprint() RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _start date := date_trunc('week', now() AT TIME ZONE 'UTC')::date; _id uuid;
BEGIN
  SELECT id INTO _id FROM weekly_sprints WHERE week_start = _start AND league_tier = 'open';
  IF _id IS NULL THEN
    UPDATE weekly_sprints SET is_active = false WHERE is_active AND week_start < _start;
    INSERT INTO weekly_sprints (week_start, week_end, league_tier, is_active)
    VALUES (_start, _start + 6, 'open', true)
    ON CONFLICT (week_start, league_tier) DO UPDATE SET is_active = true
    RETURNING id INTO _id;
  END IF;
  RETURN _id;
END $$;

-- One goal a week. The kind rotates; the target is sized to how many members learned in the last 14 days,
-- so a small community gets a goal it can reach.
CREATE OR REPLACE FUNCTION public.ensure_community_goal() RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _start timestamptz := date_trunc('week', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
  _id uuid; _n integer; _kind text; _week integer := floor(extract(epoch FROM now()) / 604800)::integer;
BEGIN
  SELECT id INTO _id FROM community_challenges WHERE is_active AND starts_at <= now() AND ends_at > now() ORDER BY starts_at DESC LIMIT 1;
  IF _id IS NOT NULL THEN RETURN _id; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('community_goal'));
  SELECT id INTO _id FROM community_challenges WHERE is_active AND starts_at <= now() AND ends_at > now() ORDER BY starts_at DESC LIMIT 1;
  IF _id IS NOT NULL THEN RETURN _id; END IF;
  UPDATE community_challenges SET is_active = false WHERE is_active AND ends_at <= now();
  SELECT greatest(1, count(DISTINCT user_id))::integer INTO _n FROM xp_transactions WHERE created_at > now() - interval '14 days';
  _kind := (ARRAY['lessons', 'badges', 'practice', 'xp', 'reflections'])[(_week % 5) + 1];
  INSERT INTO community_challenges (title, description, goal_type, goal_target, current_progress, reward_description, reward_icon, starts_at, ends_at, is_active, completed)
  SELECT t.title, t.description, _kind, t.target, 0, 'A Double XP token for everyone who helps', 'zap', _start, _start + interval '7 days', true, false
  FROM (VALUES
    ('lessons', 'Finish lessons together', 'Every lesson anyone finishes this week counts.', greatest(10, _n * 5)),
    ('badges', 'Earn badges together', 'Every badge quiz passed this week counts.', greatest(3, _n)),
    ('practice', 'Practise together', 'Every practice round or scenario this week counts.', greatest(6, _n * 3)),
    ('xp', 'Earn XP together', 'All the XP the community earns this week counts.', greatest(300, _n * 120)),
    ('reflections', 'Reflect together', 'Every reflection written this week counts.', greatest(4, _n * 2))
  ) AS t(kind, title, description, target) WHERE t.kind = _kind
  RETURNING id INTO _id;
  RETURN _id;
END $$;

CREATE OR REPLACE FUNCTION public.grant_learning_reward(_user uuid, _kind text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _kind = 'doubler' THEN
    UPDATE user_learning_stats SET xp_doublers = least(3, coalesce(xp_doublers, 0) + 1) WHERE user_id = _user;
  ELSIF _kind = 'freeze' THEN
    UPDATE user_learning_stats SET streak_freezes = least(3, coalesce(streak_freezes, 0) + 1) WHERE user_id = _user;
  ELSIF _kind = 'boost' THEN
    UPDATE user_learning_stats SET boost_credits = coalesce(boost_credits, 0) + 1 WHERE user_id = _user;
  END IF;
END $$;
REVOKE EXECUTE ON FUNCTION public.grant_learning_reward(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_weekly_sprint() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_community_goal() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.track_learning_event() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _learning boolean := NEW.source IN ('section_complete', 'reflection', 'quiz_pass', 'quiz_perfect', 'scenario', 'practice', 'practice_tab', 'tier_review', 'listen');
  _quiz boolean := false; _sprint uuid; _xp integer; _tier integer; _goal community_challenges%ROWTYPE;
  _goal_id uuid; _delta integer := 0; _total integer; _ch daily_challenges%ROWTYPE; _inc integer := 0; _reward text;
BEGIN
  IF NOT _learning OR coalesce(NEW.xp_amount, 0) < 0 THEN RETURN NEW; END IF;
  -- A passed quiz can write two rows (pass and perfect). It counts once.
  IF NEW.source IN ('quiz_pass', 'quiz_perfect') THEN
    _quiz := NOT EXISTS (SELECT 1 FROM xp_transactions x WHERE x.user_id = NEW.user_id AND x.id <> NEW.id
      AND x.source IN ('quiz_pass', 'quiz_perfect') AND x.source_id IS NOT DISTINCT FROM NEW.source_id AND x.created_at > now() - interval '1 hour');
  END IF;

  -- Weekly sprint: a personal XP target with three marks.
  _sprint := ensure_weekly_sprint();
  INSERT INTO sprint_participants (sprint_id, user_id, xp_earned, lessons_completed)
  VALUES (_sprint, NEW.user_id, NEW.xp_amount, (NEW.source = 'section_complete')::integer)
  ON CONFLICT (sprint_id, user_id) DO UPDATE SET xp_earned = coalesce(sprint_participants.xp_earned, 0) + EXCLUDED.xp_earned,
    lessons_completed = coalesce(sprint_participants.lessons_completed, 0) + EXCLUDED.lessons_completed, updated_at = now()
  RETURNING xp_earned, tier_reached INTO _xp, _tier;
  IF _tier < 1 AND _xp >= 100 THEN PERFORM grant_learning_reward(NEW.user_id, 'freeze'); _tier := 1; END IF;
  IF _tier < 2 AND _xp >= 250 THEN PERFORM grant_learning_reward(NEW.user_id, 'doubler'); _tier := 2; END IF;
  IF _tier < 3 AND _xp >= 500 THEN PERFORM grant_learning_reward(NEW.user_id, 'boost'); _tier := 3; END IF;
  UPDATE sprint_participants SET tier_reached = _tier WHERE sprint_id = _sprint AND user_id = NEW.user_id AND tier_reached <> _tier;

  -- Community goal.
  -- Made first, read second: a row a function inserts is not visible to the statement that called it.
  _goal_id := ensure_community_goal();
  SELECT * INTO _goal FROM community_challenges WHERE id = _goal_id;
  IF FOUND AND NOT coalesce(_goal.completed, false) THEN
    _delta := CASE _goal.goal_type
      WHEN 'lessons' THEN (NEW.source = 'section_complete')::integer
      WHEN 'badges' THEN _quiz::integer
      WHEN 'practice' THEN (NEW.source IN ('practice', 'practice_tab', 'scenario', 'tier_review'))::integer
      WHEN 'xp' THEN NEW.xp_amount
      WHEN 'reflections' THEN (NEW.source = 'reflection')::integer
      ELSE 0 END;
    IF _delta > 0 THEN
      INSERT INTO community_challenge_contributions (challenge_id, user_id, amount) VALUES (_goal.id, NEW.user_id, _delta)
      ON CONFLICT (challenge_id, user_id) DO UPDATE SET amount = community_challenge_contributions.amount + EXCLUDED.amount, updated_at = now();
      UPDATE community_challenges SET current_progress = coalesce(current_progress, 0) + _delta, updated_at = now()
      WHERE id = _goal.id RETURNING current_progress INTO _total;
      IF _total >= _goal.goal_target THEN
        UPDATE community_challenges SET completed = true WHERE id = _goal.id AND NOT coalesce(completed, false);
        IF FOUND THEN
          PERFORM grant_learning_reward(c.user_id, 'doubler') FROM community_challenge_contributions c WHERE c.challenge_id = _goal.id AND NOT c.rewarded;
          UPDATE community_challenge_contributions SET rewarded = true WHERE challenge_id = _goal.id;
        END IF;
      END IF;
    END IF;
  END IF;

  -- Today's challenge.
  SELECT * INTO _ch FROM daily_challenges WHERE user_id = NEW.user_id AND challenge_date = (now() AT TIME ZONE 'UTC')::date AND reward_kind IS NOT NULL AND NOT coalesce(completed, false) FOR UPDATE;
  IF FOUND THEN
    _inc := CASE _ch.challenge_type
      WHEN 'sections' THEN (NEW.source = 'section_complete')::integer
      WHEN 'xp' THEN NEW.xp_amount
      WHEN 'practice' THEN (NEW.source IN ('practice', 'practice_tab', 'scenario', 'tier_review'))::integer
      WHEN 'reflection' THEN (NEW.source = 'reflection')::integer
      WHEN 'perfect_quiz' THEN (NEW.source = 'quiz_perfect')::integer
      WHEN 'badge' THEN _quiz::integer
      WHEN 'mix' THEN (NOT EXISTS (SELECT 1 FROM xp_transactions x WHERE x.user_id = NEW.user_id AND x.id <> NEW.id AND x.source = NEW.source
        AND x.created_at >= date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'))::integer
      ELSE 0 END;
    IF _inc > 0 THEN
      UPDATE daily_challenges SET current_progress = coalesce(current_progress, 0) + _inc,
        completed = coalesce(current_progress, 0) + _inc >= target_value WHERE id = _ch.id
      RETURNING CASE WHEN completed THEN reward_kind END INTO _reward;
      IF _reward IS NOT NULL THEN PERFORM grant_learning_reward(NEW.user_id, _reward); END IF;
    END IF;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Counting a goal must never stop a member from being paid their XP.
  RAISE WARNING 'track_learning_event: %', SQLERRM;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_track_learning_event ON public.xp_transactions;
CREATE TRIGGER trg_track_learning_event AFTER INSERT ON public.xp_transactions
  FOR EACH ROW EXECUTE FUNCTION public.track_learning_event();

-- Today's challenge, chosen by the server: never the same kind two days running.
CREATE OR REPLACE FUNCTION public.get_daily_challenge() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _today date := (now() AT TIME ZONE 'UTC')::date; _row daily_challenges%ROWTYPE; _last text; _kind text; _target integer; _freezes integer; _doublers integer;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  SELECT * INTO _row FROM daily_challenges WHERE user_id = _uid AND challenge_date = _today;
  IF NOT FOUND THEN
    SELECT challenge_type INTO _last FROM daily_challenges WHERE user_id = _uid AND challenge_date < _today ORDER BY challenge_date DESC LIMIT 1;
    SELECT k INTO _kind FROM unnest(ARRAY['sections', 'practice', 'mix', 'reflection', 'xp', 'perfect_quiz', 'sections', 'practice']) k
      WHERE k IS DISTINCT FROM _last ORDER BY random() LIMIT 1;
    _target := CASE _kind WHEN 'sections' THEN (ARRAY[1, 2, 3])[1 + floor(random() * 3)::integer] WHEN 'xp' THEN (ARRAY[20, 30, 40])[1 + floor(random() * 3)::integer]
      WHEN 'mix' THEN 2 ELSE 1 END;
    SELECT coalesce(streak_freezes, 0), coalesce(xp_doublers, 0) INTO _freezes, _doublers FROM user_learning_stats WHERE user_id = _uid;
    INSERT INTO daily_challenges (user_id, challenge_type, target_value, current_progress, completed, xp_reward, challenge_date, reward_kind)
    VALUES (_uid, _kind, _target, 0, false, 0, _today, CASE WHEN coalesce(_doublers, 0) >= 3 AND coalesce(_freezes, 0) < 3 THEN 'freeze' ELSE 'doubler' END)
    ON CONFLICT (user_id, challenge_date) DO NOTHING;
    SELECT * INTO _row FROM daily_challenges WHERE user_id = _uid AND challenge_date = _today;
  END IF;
  RETURN jsonb_build_object('type', _row.challenge_type, 'target', _row.target_value, 'progress', least(coalesce(_row.current_progress, 0), _row.target_value),
    'completed', coalesce(_row.completed, false), 'reward', _row.reward_kind, 'xp_reward', coalesce(_row.xp_reward, 0));
END $$;
REVOKE EXECUTE ON FUNCTION public.get_daily_challenge() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_daily_challenge() TO authenticated;

-- This week for one member: their sprint and the community goal.
CREATE OR REPLACE FUNCTION public.get_week_status() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _sprint uuid; _goal_id uuid; _goal community_challenges%ROWTYPE; _xp integer; _tier integer; _joined integer; _mine integer;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  _sprint := ensure_weekly_sprint();
  _goal_id := ensure_community_goal();
  SELECT * INTO _goal FROM community_challenges WHERE id = _goal_id;
  SELECT xp_earned, tier_reached INTO _xp, _tier FROM sprint_participants WHERE sprint_id = _sprint AND user_id = _uid;
  SELECT count(*)::integer INTO _joined FROM sprint_participants WHERE sprint_id = _sprint;
  SELECT amount INTO _mine FROM community_challenge_contributions WHERE challenge_id = _goal.id AND user_id = _uid;
  RETURN jsonb_build_object(
    'sprint', jsonb_build_object('xp', coalesce(_xp, 0), 'tier', coalesce(_tier, 0), 'marks', jsonb_build_array(100, 250, 500),
      'ends_at', (SELECT (week_end + 1)::timestamptz FROM weekly_sprints WHERE id = _sprint), 'members', coalesce(_joined, 0)),
    'goal', jsonb_build_object('title', _goal.title, 'description', _goal.description, 'kind', _goal.goal_type, 'target', _goal.goal_target,
      'progress', least(coalesce(_goal.current_progress, 0), _goal.goal_target), 'completed', coalesce(_goal.completed, false),
      'ends_at', _goal.ends_at, 'mine', coalesce(_mine, 0)));
END $$;
REVOKE EXECUTE ON FUNCTION public.get_week_status() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_week_status() TO authenticated;
