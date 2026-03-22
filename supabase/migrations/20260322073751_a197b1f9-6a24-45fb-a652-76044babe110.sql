-- Fix: Remove direct INSERT on user_roles, use a SECURITY DEFINER function instead
DROP POLICY IF EXISTS "Admins can grant roles" ON public.user_roles;

-- Create a secure function for granting roles
CREATE OR REPLACE FUNCTION public.grant_role(_target_user_id uuid, _role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only admins can grant roles
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: only admins can grant roles';
  END IF;
  
  -- Cannot grant admin role to self
  IF _target_user_id = auth.uid() AND _role = 'admin' THEN
    RAISE EXCEPTION 'Cannot grant admin role to yourself';
  END IF;

  INSERT INTO public.user_roles (user_id, role, granted_by)
  VALUES (_target_user_id, _role, auth.uid())
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$function$;

-- Create a secure function for revoking roles
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

  DELETE FROM public.user_roles
  WHERE user_id = _target_user_id AND role = _role;
END;
$function$;

-- Remove direct admin delete policy too (use revoke_role RPC instead)
DROP POLICY IF EXISTS "Admins can revoke roles" ON public.user_roles;

-- Create a profiles_public view with only non-sensitive fields for other users
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT 
  id, name, age, bio, location, profile_image, gender, pronouns,
  relationship_style, relationship_status, experience_level,
  interests, photos, display_name, is_verified, onboarding_completed,
  looking_for, zodiac_sign, languages, height_cm, created_at
FROM public.profiles;

-- Restrict profiles SELECT to own profile only
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Allow all authenticated users to read the non-sensitive public view
-- (views inherit the privileges of the view definer, but we need a permissive approach)
-- Instead, create a security definer function to fetch public profile data
CREATE OR REPLACE FUNCTION public.get_public_profile(_user_id uuid)
RETURNS TABLE (
  id uuid, name text, age integer, bio text, location text, profile_image text,
  gender text, pronouns text, relationship_style text, relationship_status text,
  experience_level text, interests text[], photos text[], display_name text,
  is_verified boolean, onboarding_completed boolean, looking_for text,
  zodiac_sign text, languages text[], height_cm integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    p.id, p.name, p.age, p.bio, p.location, p.profile_image,
    p.gender, p.pronouns, p.relationship_style, p.relationship_status,
    p.experience_level, p.interests, p.photos, p.display_name,
    p.is_verified, p.onboarding_completed, p.looking_for,
    p.zodiac_sign, p.languages, p.height_cm
  FROM public.profiles p
  WHERE p.id = _user_id
$function$;

-- Function to get discovery profiles (non-sensitive fields only)
CREATE OR REPLACE FUNCTION public.get_discovery_profiles(_exclude_ids uuid[])
RETURNS TABLE (
  id uuid, name text, age integer, bio text, location text, profile_image text,
  gender text, pronouns text, relationship_style text, relationship_status text,
  experience_level text, interests text[], photos text[], display_name text,
  is_verified boolean, looking_for text, zodiac_sign text, languages text[], height_cm integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    p.id, p.name, p.age, p.bio, p.location, p.profile_image,
    p.gender, p.pronouns, p.relationship_style, p.relationship_status,
    p.experience_level, p.interests, p.photos, p.display_name,
    p.is_verified, p.looking_for, p.zodiac_sign, p.languages, p.height_cm
  FROM public.profiles p
  WHERE p.onboarding_completed = true
    AND p.id != ALL(_exclude_ids)
$function$;