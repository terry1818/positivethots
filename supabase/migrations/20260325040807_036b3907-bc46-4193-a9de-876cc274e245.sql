CREATE OR REPLACE FUNCTION public.get_funnel_metrics()
RETURNS TABLE(
  total_users bigint,
  onboarded_users bigint,
  users_with_badges bigint,
  users_in_discovery bigint,
  paid_subscribers bigint
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY SELECT
    (SELECT count(*) FROM profiles)::bigint,
    (SELECT count(*) FROM profiles WHERE onboarding_completed = true)::bigint,
    (SELECT count(DISTINCT user_id) FROM user_badges)::bigint,
    (SELECT count(DISTINCT swiper_id) FROM swipes)::bigint,
    (SELECT count(*) FROM subscriptions WHERE status = 'active')::bigint;
END;
$$;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_started_at timestamptz DEFAULT NULL;