
-- Profile Boosts table
CREATE TABLE public.profile_boosts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  activated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_boosts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own boosts" ON public.profile_boosts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own boosts" ON public.profile_boosts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Super Likes table
CREATE TABLE public.super_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.super_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own sent super likes" ON public.super_likes
  FOR SELECT TO authenticated USING (auth.uid() = sender_id);

CREATE POLICY "Users can see super likes received" ON public.super_likes
  FOR SELECT TO authenticated USING (auth.uid() = receiver_id);

CREATE POLICY "Users can insert own super likes" ON public.super_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

-- Super Like Balance table
CREATE TABLE public.super_like_balance (
  user_id uuid PRIMARY KEY,
  balance integer NOT NULL DEFAULT 0,
  last_daily_refresh date,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.super_like_balance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own balance" ON public.super_like_balance
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own balance" ON public.super_like_balance
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own balance" ON public.super_like_balance
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Refresh daily super likes function
CREATE OR REPLACE FUNCTION public.refresh_daily_super_likes(_user_id uuid, _daily_limit integer DEFAULT 5)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _balance integer;
BEGIN
  IF auth.uid() != _user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  INSERT INTO public.super_like_balance (user_id, balance, last_daily_refresh, updated_at)
  VALUES (_user_id, _daily_limit, CURRENT_DATE, now())
  ON CONFLICT (user_id) DO UPDATE
  SET balance = CASE
    WHEN super_like_balance.last_daily_refresh < CURRENT_DATE THEN _daily_limit
    ELSE super_like_balance.balance
  END,
  last_daily_refresh = CASE
    WHEN super_like_balance.last_daily_refresh < CURRENT_DATE THEN CURRENT_DATE
    ELSE super_like_balance.last_daily_refresh
  END,
  updated_at = now()
  RETURNING balance INTO _balance;

  RETURN _balance;
END;
$$;

-- Indexes for performance
CREATE INDEX idx_profile_boosts_user_expires ON public.profile_boosts (user_id, expires_at);
CREATE INDEX idx_super_likes_sender ON public.super_likes (sender_id);
CREATE INDEX idx_super_likes_receiver ON public.super_likes (receiver_id);
