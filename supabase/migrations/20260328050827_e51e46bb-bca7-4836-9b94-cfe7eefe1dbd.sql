
DROP FUNCTION IF EXISTS public.get_discovery_profiles(uuid[]);

CREATE OR REPLACE FUNCTION public.get_discovery_profiles(_exclude_ids uuid[])
 RETURNS TABLE(id uuid, name text, age integer, bio text, location text, profile_image text, gender text, pronouns text, relationship_style text, relationship_status text, experience_level text, interests text[], photos text[], display_name text, is_verified boolean, looking_for text, zodiac_sign text, languages text[], height_cm integer, selected_frame text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
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
    p.selected_frame
  FROM public.profiles p
  WHERE p.onboarding_completed = true AND p.id != ALL(_exclude_ids)
$$;
