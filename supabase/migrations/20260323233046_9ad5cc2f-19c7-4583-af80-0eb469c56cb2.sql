
-- 1. Drop the insecure INSERT policy on profile_boosts
DROP POLICY IF EXISTS "Users can insert own boosts" ON public.profile_boosts;

-- 2. Create activate_vip_boost RPC
CREATE OR REPLACE FUNCTION public.activate_vip_boost()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _start_of_month timestamptz;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Check user has active VIP subscription
  IF NOT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = _user_id
      AND status = 'active'
      AND plan = 'vip'
      AND (current_period_end IS NULL OR current_period_end > now())
  ) THEN
    RAISE EXCEPTION 'VIP subscription required';
  END IF;

  -- Check if already used free boost this month
  _start_of_month := date_trunc('month', now());
  IF EXISTS (
    SELECT 1 FROM public.profile_boosts
    WHERE user_id = _user_id
      AND created_at >= _start_of_month
  ) THEN
    RAISE EXCEPTION 'Free boost already used this month';
  END IF;

  -- Insert the boost
  INSERT INTO public.profile_boosts (user_id)
  VALUES (_user_id);
END;
$$;
