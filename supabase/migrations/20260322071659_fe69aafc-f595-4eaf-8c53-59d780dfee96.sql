
-- 1. Profiles: restrict SELECT to authenticated users only
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

-- 2. User roles: restrict SELECT to own roles only
DROP POLICY IF EXISTS "Authenticated users can view roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 3. User badges: remove the overly permissive "view all" policy, keep own-only
DROP POLICY IF EXISTS "Users can view all badges" ON public.user_badges;

-- 4. Create a view for quiz questions that excludes correct_answer
CREATE OR REPLACE VIEW public.quiz_questions_public AS
  SELECT id, module_id, question, options, order_index, section_id
  FROM public.quiz_questions;

-- 5. Create server-side answer validation function
CREATE OR REPLACE FUNCTION public.validate_quiz_answer(
  _question_id uuid,
  _selected_answer integer
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.quiz_questions
    WHERE id = _question_id
      AND correct_answer = _selected_answer
  )
$$;

-- 6. Create server-side XP award function
CREATE OR REPLACE FUNCTION public.award_xp(
  _user_id uuid,
  _amount integer,
  _source text,
  _source_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _new_xp integer;
  _new_level integer;
  _current_streak integer;
  _last_activity date;
  _today date := CURRENT_DATE;
BEGIN
  -- Verify caller is the user
  IF auth.uid() != _user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Cap XP amount to prevent abuse (max 200 per transaction)
  IF _amount < 0 OR _amount > 200 THEN
    RAISE EXCEPTION 'Invalid XP amount';
  END IF;

  -- Insert XP transaction
  INSERT INTO public.xp_transactions (user_id, xp_amount, source, source_id)
  VALUES (_user_id, _amount, _source, _source_id);

  -- Get current stats
  SELECT total_xp + _amount, current_streak, last_activity_date
  INTO _new_xp, _current_streak, _last_activity
  FROM public.user_learning_stats
  WHERE user_id = _user_id;

  -- Calculate new level (every 500 XP)
  _new_level := GREATEST(1, (_new_xp / 500) + 1);

  -- Update streak
  IF _last_activity IS NULL OR _last_activity < _today - 1 THEN
    _current_streak := 1;
  ELSIF _last_activity = _today - 1 THEN
    _current_streak := _current_streak + 1;
  END IF;

  -- Update stats
  UPDATE public.user_learning_stats
  SET total_xp = _new_xp,
      current_level = _new_level,
      current_streak = _current_streak,
      longest_streak = GREATEST(longest_streak, _current_streak),
      last_activity_date = _today,
      updated_at = now()
  WHERE user_id = _user_id;

  RETURN jsonb_build_object(
    'new_xp', _new_xp,
    'new_level', _new_level,
    'new_streak', _current_streak
  );
END;
$$;

-- 7. Restrict xp_transactions to INSERT only via the award_xp function
-- Remove direct INSERT policy
DROP POLICY IF EXISTS "Users can insert own xp transactions" ON public.xp_transactions;

-- 8. Restrict user_learning_stats UPDATE from client
DROP POLICY IF EXISTS "Users can update own learning stats" ON public.user_learning_stats;
