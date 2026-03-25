
CREATE OR REPLACE FUNCTION public.get_weekly_leaderboard()
RETURNS TABLE(
  rank bigint,
  display_name text,
  sections_completed bigint,
  user_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _total_users bigint;
BEGIN
  -- Check if at least 3 users qualify
  SELECT count(DISTINCT usp.user_id) INTO _total_users
  FROM public.user_section_progress usp
  WHERE usp.completed = true
    AND usp.last_accessed >= now() - interval '7 days';

  IF _total_users < 3 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    row_number() OVER (ORDER BY count(*) DESC) AS rank,
    (split_part(p.name, ' ', 1) || CASE WHEN length(p.name) > length(split_part(p.name, ' ', 1)) THEN ' ' || left(split_part(p.name, ' ', 2), 1) || '.' ELSE '' END) AS display_name,
    count(*)::bigint AS sections_completed,
    usp.user_id
  FROM public.user_section_progress usp
  JOIN public.profiles p ON p.id = usp.user_id
  WHERE usp.completed = true
    AND usp.last_accessed >= now() - interval '7 days'
  GROUP BY usp.user_id, p.name
  ORDER BY count(*) DESC
  LIMIT 5;
END;
$$;
