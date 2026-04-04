
CREATE OR REPLACE FUNCTION public.append_tutorial_completed(_key text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET tutorials_completed = array_append(
    COALESCE(tutorials_completed, '{}'),
    _key
  )
  WHERE id = auth.uid()
  AND NOT (_key = ANY(COALESCE(tutorials_completed, '{}')));
END;
$$;

GRANT EXECUTE ON FUNCTION public.append_tutorial_completed(text) TO authenticated;
