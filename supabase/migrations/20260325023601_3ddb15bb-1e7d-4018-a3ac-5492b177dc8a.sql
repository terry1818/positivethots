-- Assign owner role to the app owner
INSERT INTO public.user_roles (user_id, role)
VALUES ('fcf7e150-d122-47e0-b30e-359668184d85', 'owner')
ON CONFLICT (user_id, role) DO NOTHING;

-- Update grant_role to use has_role check instead of hardcoded UUID
CREATE OR REPLACE FUNCTION public.grant_role(_target_user_id uuid, _role app_role)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: only admins can grant roles';
  END IF;
  IF _role = 'admin' AND NOT public.has_role(auth.uid(), 'owner') THEN
    RAISE EXCEPTION 'Only the app owner can grant admin roles';
  END IF;
  IF _target_user_id = auth.uid() AND _role = 'admin' THEN
    RAISE EXCEPTION 'Cannot grant admin role to yourself';
  END IF;
  INSERT INTO public.user_roles (user_id, role, granted_by)
  VALUES (_target_user_id, _role, auth.uid())
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$function$;

-- Update revoke_role
CREATE OR REPLACE FUNCTION public.revoke_role(_target_user_id uuid, _role app_role)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: only admins can revoke roles';
  END IF;
  IF _role = 'admin' AND NOT public.has_role(auth.uid(), 'owner') THEN
    RAISE EXCEPTION 'Only the app owner can revoke admin roles';
  END IF;
  DELETE FROM public.user_roles
  WHERE user_id = _target_user_id AND role = _role;
END;
$function$;

-- Update get_discovery_profiles to filter unapproved photos
CREATE OR REPLACE FUNCTION public.get_discovery_profiles(_exclude_ids uuid[])
 RETURNS TABLE(id uuid, name text, age integer, bio text, location text, profile_image text, gender text, pronouns text, relationship_style text, relationship_status text, experience_level text, interests text[], photos text[], display_name text, is_verified boolean, looking_for text, zodiac_sign text, languages text[], height_cm integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    p.display_name, p.is_verified, p.looking_for, p.zodiac_sign, p.languages, p.height_cm
  FROM public.profiles p
  WHERE p.onboarding_completed = true AND p.id != ALL(_exclude_ids)
$function$;

-- Update get_public_profile to filter unapproved photos
CREATE OR REPLACE FUNCTION public.get_public_profile(_user_id uuid)
 RETURNS TABLE(id uuid, name text, age integer, bio text, location text, profile_image text, gender text, pronouns text, relationship_style text, relationship_status text, experience_level text, interests text[], photos text[], display_name text, is_verified boolean, onboarding_completed boolean, looking_for text, zodiac_sign text, languages text[], height_cm integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    p.display_name, p.is_verified, p.onboarding_completed, p.looking_for,
    p.zodiac_sign, p.languages, p.height_cm
  FROM public.profiles p
  WHERE p.id = _user_id
$function$;