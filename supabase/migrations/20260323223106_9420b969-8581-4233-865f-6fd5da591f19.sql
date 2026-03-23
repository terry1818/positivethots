CREATE OR REPLACE FUNCTION public.get_sent_likes(_user_id uuid)
RETURNS TABLE(
  id uuid, name text, age integer, profile_image text, location text, swiped_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.name, p.age, p.profile_image, p.location, s.created_at as swiped_at
  FROM swipes s
  JOIN profiles p ON p.id = s.swiped_id
  WHERE s.swiper_id = _user_id AND s.direction = 'right'
    AND auth.uid() = _user_id
  ORDER BY s.created_at DESC
  LIMIT 50;
$$;