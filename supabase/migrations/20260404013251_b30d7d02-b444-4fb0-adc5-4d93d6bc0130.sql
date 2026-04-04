
-- 1. Add columns to swipes
ALTER TABLE public.swipes
  ADD COLUMN IF NOT EXISTS pass_count integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS is_permanent boolean NOT NULL DEFAULT false;

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_swipes_recycling
  ON public.swipes (swiper_id, direction, updated_at, is_permanent)
  WHERE direction = 'left';

CREATE INDEX IF NOT EXISTS idx_swipes_pass_count
  ON public.swipes (swiper_id, swiped_id, pass_count)
  WHERE direction = 'left';

-- 3. Drop old function
DROP FUNCTION IF EXISTS public.get_discovery_profiles(uuid[]);

-- 4. Recreate with is_recycled
CREATE FUNCTION public.get_discovery_profiles(_exclude_ids uuid[])
RETURNS TABLE(
  id uuid, name text, age integer, bio text, location text, profile_image text,
  gender text, pronouns text, relationship_style text, relationship_status text,
  experience_level text, interests text[], photos text[], display_name text,
  is_verified boolean, looking_for text, zodiac_sign text, languages text[],
  height_cm integer, selected_frame text, is_recycled boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id, p.name, p.age, p.bio, p.location,
    CASE
      WHEN EXISTS (
        SELECT 1 FROM public.user_photos up
        WHERE up.user_id = p.id AND up.photo_url = p.profile_image AND up.moderation_status != 'approved'
      ) THEN NULL
      ELSE p.profile_image
    END as profile_image,
    p.gender, p.pronouns, p.relationship_style, p.relationship_status,
    p.experience_level, p.interests,
    COALESCE(
      (SELECT array_agg(up.photo_url ORDER BY up.order_index)
       FROM public.user_photos up
       WHERE up.user_id = p.id AND up.visibility = 'public' AND up.moderation_status = 'approved'),
      p.photos
    ) as photos,
    p.display_name, p.is_verified, p.looking_for, p.zodiac_sign, p.languages, p.height_cm,
    p.selected_frame,
    EXISTS (
      SELECT 1 FROM public.swipes s
      WHERE s.swiper_id = auth.uid() AND s.swiped_id = p.id AND s.direction = 'left'
    ) as is_recycled
  FROM public.profiles p
  WHERE p.onboarding_completed = true
    AND p.id != ALL(_exclude_ids)
    AND NOT EXISTS (
      SELECT 1 FROM public.swipes s
      WHERE s.swiper_id = auth.uid() AND s.swiped_id = p.id
        AND s.direction = 'left' AND s.is_permanent = true
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.swipes s
      WHERE s.swiper_id = auth.uid() AND s.swiped_id = p.id
        AND s.direction = 'left' AND s.is_permanent = false
        AND s.updated_at > now() - interval '7 days'
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.swipes s
      WHERE s.swiper_id = auth.uid() AND s.swiped_id = p.id
        AND s.direction = 'right'
    )
  ORDER BY
    EXISTS (
      SELECT 1 FROM public.swipes s
      WHERE s.swiper_id = auth.uid() AND s.swiped_id = p.id AND s.direction = 'left'
    ) ASC,
    p.id
$$;

-- 5. record_pass
CREATE OR REPLACE FUNCTION public.record_pass(_swiper_id uuid, _swiped_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _pass_count integer;
  _is_permanent boolean;
BEGIN
  IF auth.uid() != _swiper_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  INSERT INTO public.swipes (swiper_id, swiped_id, direction, pass_count, updated_at, is_permanent)
  VALUES (_swiper_id, _swiped_id, 'left', 1, now(), false)
  ON CONFLICT (swiper_id, swiped_id) DO UPDATE SET
    pass_count = swipes.pass_count + 1,
    updated_at = now(),
    direction = 'left',
    is_permanent = CASE WHEN swipes.pass_count + 1 >= 3 THEN true ELSE false END
  RETURNING swipes.pass_count, swipes.is_permanent
  INTO _pass_count, _is_permanent;

  RETURN jsonb_build_object('pass_count', _pass_count, 'is_permanent', _is_permanent);
END;
$$;

-- 6. reset_discovery_feed
CREATE OR REPLACE FUNCTION public.reset_discovery_feed()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _reset_count integer;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.swipes
  SET updated_at = now() - interval '8 days'
  WHERE swiper_id = _user_id
    AND direction = 'left'
    AND is_permanent = false;

  GET DIAGNOSTICS _reset_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'reset_count', _reset_count,
    'message', 'Discovery feed reset! ' || _reset_count || ' profiles will reappear.'
  );
END;
$$;

-- 7. Delete policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'swipes' AND policyname = 'Users can delete own swipes'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can delete own swipes" ON public.swipes FOR DELETE TO authenticated USING (auth.uid() = swiper_id)';
  END IF;
END;
$$;

-- 8. Grants
GRANT EXECUTE ON FUNCTION public.get_discovery_profiles(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_pass(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_discovery_feed() TO authenticated;
