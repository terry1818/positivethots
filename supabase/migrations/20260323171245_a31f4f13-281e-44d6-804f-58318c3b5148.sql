
CREATE OR REPLACE FUNCTION public.get_likers_for_user(_user_id uuid)
RETURNS TABLE(
  id uuid,
  name text,
  age integer,
  profile_image text,
  location text,
  bio text,
  is_super_like boolean,
  is_premium boolean,
  liker_count integer
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _is_premium boolean := false;
  _liker_count integer := 0;
BEGIN
  -- Verify caller is the user
  IF auth.uid() != _user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Check if user has active subscription
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = _user_id
      AND s.status = 'active'
      AND (s.current_period_end IS NULL OR s.current_period_end > now())
  ) INTO _is_premium;

  -- Get liker IDs (people who swiped right on this user but aren't matched yet)
  CREATE TEMP TABLE _liker_ids ON COMMIT DROP AS
  SELECT sw.swiper_id,
         EXISTS (SELECT 1 FROM public.super_likes sl WHERE sl.sender_id = sw.swiper_id AND sl.receiver_id = _user_id) AS is_super
  FROM public.swipes sw
  WHERE sw.swiped_id = _user_id
    AND sw.direction = 'right'
    AND NOT EXISTS (
      SELECT 1 FROM public.matches m
      WHERE (m.user1_id = _user_id AND m.user2_id = sw.swiper_id)
         OR (m.user2_id = _user_id AND m.user1_id = sw.swiper_id)
    );

  SELECT count(*)::integer INTO _liker_count FROM _liker_ids;

  IF NOT _is_premium THEN
    -- Non-premium: return only count, no identity data
    RETURN QUERY SELECT
      NULL::uuid, NULL::text, NULL::integer, NULL::text, NULL::text, NULL::text,
      false, false, _liker_count;
    RETURN;
  END IF;

  -- Premium: return full liker profiles
  RETURN QUERY
  SELECT
    p.id, p.name, p.age, p.profile_image, p.location, p.bio,
    li.is_super,
    true,
    _liker_count
  FROM _liker_ids li
  JOIN public.profiles p ON p.id = li.swiper_id
  ORDER BY li.is_super DESC;
END;
$$;
