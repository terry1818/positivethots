
-- 1. CRITICAL: Prevent any client-side INSERT on user_roles (only grant_role RPC can insert)
-- The table already has no INSERT policy, which means inserts are blocked by default with RLS enabled.
-- But let's be explicit and ensure no future policy accidentally opens it.
-- No action needed here — confirmed: user_roles has RLS enabled and no INSERT policy = blocked. ✓

-- 2. Fix super_like_balance: Remove the unrestricted UPDATE policy, replace with function-only updates
DROP POLICY IF EXISTS "Users can update own balance" ON public.super_like_balance;

-- Create a secure function to decrement super like balance (already have refresh_daily_super_likes for resets)
CREATE OR REPLACE FUNCTION public.decrement_super_like(_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _new_balance integer;
BEGIN
  IF auth.uid() != _user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.super_like_balance
  SET balance = balance - 1, updated_at = now()
  WHERE user_id = _user_id AND balance > 0
  RETURNING balance INTO _new_balance;

  IF _new_balance IS NULL THEN
    RAISE EXCEPTION 'No super likes remaining';
  END IF;

  RETURN _new_balance;
END;
$$;

-- 3. Fix matches INSERT: Remove permissive policy, matches should only be created via check_match RPC
DROP POLICY IF EXISTS "Users can create matches" ON public.matches;

-- 4. Fix quiz_questions: Remove the overly broad "true" SELECT policy that exposes correct_answer
DROP POLICY IF EXISTS "Authenticated users can view quiz questions via public view" ON public.quiz_questions;
-- Users should use the quiz_questions_public view (which excludes correct_answer) instead.
-- The admin SELECT policy already exists for admins.

-- 5. Verify profile SELECT is locked to own profile only — confirmed from RLS scan:
-- profiles SELECT: (auth.uid() = id) — correct. Discovery uses get_discovery_profiles / get_public_profile RPCs. ✓
